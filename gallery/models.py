# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import os
import re

import cwc.settings

from decimal import Decimal
from datetime import datetime
from PIL import Image

from django.db import models

from django.contrib.sessions.models import Session
from django.contrib.sessions.backends.db import SessionStore
from django.shortcuts import render
from django.http import HttpResponse
from django.core.paginator import Paginator, EmptyPage
from django.utils import timezone

EMAIL_REGEX = re.compile(
    r'^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$')

MAILGUN_API_KEY = cwc.settings.MAILGUN_API_KEY

PRODUCTS_PER_PAGE = cwc.settings.PRODUCTS_PER_PAGE

class AddressManager(models.Manager):
    def store_address(self, request):
        errors = []

        recipientName = request.POST['recipientName']
        line1 = request.POST['line1']
        line2 = request.POST['line2']
        city = request.POST['city']
        countryCode = request.POST['countryCode']
        postalCode = request.POST['postalCode']
        postalCodeExt = request.POST['postalCodeExt']
        state = request.POST['state']
        phone = request.POST['phone']
        email = request.POST['email']
        try:
            subscribed = request.POST['subscribed']
        except:
            subscribed = "False"

        postalCodeExt = '0000' if postalCodeExt is '' else postalCodeExt

        if len(recipientName) is 0:
            errors.append('Please enter a recipient name.')
        if len(line1) is 0:
            errors.append('Please enter an address.')
        if len(city) is 0:
            errors.append('Please enter a city.')
        if len(countryCode) is 0:
            errors.append('Please enter a country.')
        if countryCode is 'US' and len(postalCode) is 0:
            errors.append('Please enter a postal code.')
        if len(state) is 0 and countryCode in ('US', 'CA'):
            errors.append('Please enter a state/province.')
        if len(phone) is 0:
            errors.append('Please enter a phone number.')
        if not EMAIL_REGEX.match(email):
            errors.append('Please enter a valid email address.')

        new_address = {
            'recipientName': recipientName,
            'line1': line1,
            'line2': line2,
            'city': city,
            'countryCode': countryCode,
            'postalCode': postalCode,
            'postalCodeExt': postalCodeExt,
            'state': state,
            'phone': phone,
            'email': email,
            'subscribed': True if subscribed == 'True' else False,
        }
        request.session['shipping_address'] = new_address

        if not errors:
            return (True, new_address)

        return (False, errors)

    def create_address(self, request):
        return Address.objects.create(
            recipientName=request.session['shipping_address']['recipientName'],
            line1=request.session['shipping_address']['line1'],
            line2=request.session['shipping_address']['line2'],
            city=request.session['shipping_address']['city'],
            countryCode=request.session['shipping_address']['countryCode'],
            postalCode=request.session['shipping_address']['postalCode'],
            postalCodeExt='0000' if not request.session['shipping_address']['postalCodeExt'] else request.session['shipping_address']['postalCodeExt'],
            state=request.session['shipping_address']['state'],
            phone=request.session['shipping_address']['phone'],
            email=request.session['shipping_address']['email'],
        )

class ProductManager(models.Manager):
    def create_product(self, request):
        errors = []

        title = request.POST.get('title', '')
        price = request.POST.get('price', '')
        width = request.POST.get('width', '')
        length = request.POST.get('length', '')
        height = request.POST.get('height', '')
        description = request.POST.get('description', '')
        image = request.FILES.get('image', None)
        try:
            archive = request.POST['archive']
        except:
            archive = "False"

        request.session['new_product'] = {
            'title': title,
            'price': price,
            'width': width,
            'length': length,
            'height': height,
            'description': description,
            'archive': True if archive == 'True' else False,
        }

        price = Decimal(0 if price == '' else price)

        if len(title) == 0:
            errors.append("Please enter a title.")
        if price <= 0:
            errors.append("Please enter a valid price.")
        if len(width) > 20 or len(length) > 20 or len(height) > 20:
            errors.append("Dimensions must not contain more than 20 characters.")
        if image == None or image.name.endswith(
            ('.png', '.jpeg', '.jpg', '.gif', '.PNG', '.JPEG', '.JPG', '.GIF',)) is False:
            errors.append("Please choose a valid image.")

        if not errors:
            new_product = Product.objects.create(
                name=title,
                price_per_unit=price,
                description=description,
                width=width,
                length=length,
                height=height,
                image=image,
                tax_percentage=0.0000,
                limited=True,
                in_stock=0 if archive == 'True' else 1,
                active_for_sale=True,
            )

            request.session.modified = True

            try:
                if os.name == 'nt':
                    self.__create_gallery_pic(os.path.dirname(os.path.realpath( __file__)).replace('\\gallery', '') + new_product.image.url.replace('/', '\\'))
                else:
                    self.__create_gallery_pic(os.path.dirname(os.path.realpath(__file__)).replace('/gallery', '') + new_product.image.url)
            except OSError:
                errors.append('There was an error creating the image thumbnail.')

                return (False, errors)

            del request.session['new_product']
            return (True, new_product)

        return (False, errors)

    def edit_product(self, request):
        id = int(request.POST['id'])
        product = Product.objects.get(id=id)
        errors = []

        title = request.POST.get('title', '')
        price = request.POST.get('price', '')
        price = Decimal(0 if price == '' else price)
        width = request.POST.get('width', '')
        length = request.POST.get('length', '')
        height = request.POST.get('height', '')
        description = request.POST.get('description', '')
        image = request.FILES.get('image', None)
        try:
            archive = request.POST['archive']
        except:
            archive = "False"

        if len(title) < 1:
            errors.append("Please enter a title.")
        if price <= 0:
            errors.append("Please enter a valid price.")
        if len(width) > 20 or len(length) > 20 or len(height) > 20:
            errors.append("Dimensions must not contain more than 20 characters.")
        if image != None and image.name.endswith(('.png', '.jpeg', '.jpg', '.gif', '.PNG', '.JPEG', '.JPG', '.GIF',)) is False:
            errors.append("Please choose a valid image.")

        if not errors:
            product.name = title
            product.price_per_unit = price
            product.width = width
            product.length = length
            product.height = height
            product.description = description
            if image != None:
                filepath = 'media/' + product.image.name
                try:
                    os.remove(filepath)
                except FileNotFoundError:
                    pass
                product.image = image
            product.in_stock = 0 if archive == 'True' else 1
            product.save()

            if image != None:
                if os.name == 'nt':
                    self.__create_gallery_pic(os.path.dirname(os.path.realpath( __file__)).replace('\\gallery', '') + product.image.url.replace('/', '\\'))
                else:
                    self.__create_gallery_pic(os.path.dirname(os.path.realpath(__file__)).replace('/gallery', '') + product.image.url)

            return (True, product)

        return (False, errors)

    def delete_product(self, request):
        id = int(request.POST['id'])

        # remove image
        product = Product.objects.get(id=id)
        filepath = 'media/' + product.image.name
        try:
            os.remove(filepath)
        except FileNotFoundError:
            pass

        # update cart in active sessions containing product
        active_sessions = Session.objects.filter(expire_date__gte=datetime.now())
        for session in active_sessions:
            session_data = session.get_decoded()
            try:
                cart = session_data['cart']
                if id in cart:
                    cart.remove(id)
                    user_session = SessionStore(session_key=session.session_key)
                    user_session['cart'] = cart
                    user_session.save()
            except KeyError:
                pass

        return product.delete()

    def get_html(self, request, view):
        page = request.GET.get('page', 1)
        filter_string = request.GET.get('filterString', '')
        filter_list = [] if filter_string == '' else filter_string.split(',')

        if request.method == 'GET':
            if view == 'gallery':
                if not filter_list:
                    products = Product.objects \
                        .filter(in_stock__gte=1) \
                        .order_by('-date_created')
                else:
                    products = Product.objects \
                        .filter(in_stock__gte=1) \
                        .filter(name__in=filter_list) \
                        .order_by('-date_created')
            elif view == 'archive':
                if not filter_list:
                    products = Product.objects \
                        .filter(in_stock=0) \
                        .order_by('-date_created')
                else:
                    products = Product.objects \
                        .filter(in_stock=0) \
                        .filter(name__in=filter_list) \
                        .order_by('-date_created')

            paginator = Paginator(products, PRODUCTS_PER_PAGE)

            try:
                current_page = paginator.page(page)
            except EmptyPage:
                return HttpResponse(status=204)

            return render(request, 'gallery/products.html', {
                'products': current_page,
            })

        return HttpResponse(status=500)

    def __create_gallery_pic(self, src_path):
        image = Image.open(src_path)

        # resize
        basewidth = 474
        width_percent = (basewidth / float(image.size[0]))
        hsize = int((float(image.size[1]) * float(width_percent)))

        image = image.resize((basewidth, hsize), Image.ANTIALIAS)

        # convert alpha pixels to white
        if image.mode == 'RGB':
            pass
        elif image.mode == 'P':
            image = image.convert('RGB')
        elif image.mode == 'RGBA':
            pixel_data = image.load()

            for y in range(image.size[1]):
                for x in range(image.size[0]):
                    if pixel_data[x, y][3] < 255:
                        pixel_data[x, y] = (255, 255, 255, 255)

            image = image.convert('RGB')

        image.save(src_path + '.gallery.jpg')

    def create_gallery_pics(self):
        for product in Product.objects.all():
            if os.name == 'nt':
                self.__create_gallery_pic(os.path.dirname(os.path.realpath( __file__)).replace('\\gallery', '') + product.image.url.replace('/', '\\'))
            else:
                self.__create_gallery_pic(os.path.dirname(
                    os.path.realpath(__file__)).replace('/gallery', '') + product.image.url)

    def get_filters(self):
        filters = []
        for product in Product.objects.all():
            if not any(product.name == f['name'] for f in filters):
                filters.append({
                    'name': product.name,
                    'gallery': 0 if product.in_stock == 0 else 1,
                    'archive': 1 if product.in_stock == 0 else 0,
                })
            else:
                for f in filters:
                    if f['name'] == product.name:
                        if product.in_stock > 0:
                            f['gallery'] = f['gallery'] + 1
                        else:
                            f['archive'] = f['archive'] + 1
        return sorted(filters, key=lambda k: k['name'])

    def mark_product_sold(self, pk, quantity=1):
        product = Product.objects.get(pk=pk)
        product.in_stock = product.in_stock - quantity
        product.save()

    def get_cart(self, request):
        cart = request.session.get('cart', [])
        products = Product.objects.filter(pk__in=cart).order_by('-date_updated')

        return products

    def clear_cart(self, request):
        request.session['cart'] = []

class SaleItemManager(models.Manager):
    pass

class SaleManager(models.Manager):
    def create_sale(self, request):
        errors = []

        sale_amount = Decimal(request.POST['sale_amount'])
        tax_amount = Decimal(request.POST['tax_amount'])
        shipping_address = Address.objects.create_address(request)

        if not shipping_address:
            errors.append("There was an error creating the address object.")

        if not errors:
            new_sale = Sale.objects.create(
                sale_amount=sale_amount,
                tax_amount=tax_amount,
                shipping_address=shipping_address,
                date_shipped=None,
            )

            for product in Product.objects.get_cart(request):
                SaleItem.objects.create(
                    quantity_sold=1,
                    price_per_unit=product.price_per_unit,
                    price=product.price_per_unit,
                    sale=new_sale,
                    product=product,
                )

                Product.objects.mark_product_sold(product.pk)

            Product.objects.clear_cart(request)

            return (True, new_sale)

        return (False, errors)

    def mark_shipped(self, request):
        orders = request.POST.getlist('orders')
        for pk in orders:
            order = Sale.objects.get(pk=pk)
            order.shipped = True
            order.date_shipped = timezone.now()
            order.save()
            self.__shipping_confirm(order.shipping_address.email)
        return True

    def delete_sales(self, request):
        SaleItem.objects.filter(sale__in=request.POST['orders']).delete()
        Sale.objects.filter(pk__in=request.POST['orders']).delete()

class Address(models.Model):
    recipientName = models.CharField(max_length=255)
    line1 = models.CharField(max_length=255)
    line2 = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    countryCode = models.CharField(max_length=2)
    postalCode = models.CharField(max_length=11)
    state = models.CharField(max_length=2)
    email = models.CharField(max_length=30)
    subscribed = models.BooleanField(default=False)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    objects = AddressManager()

class Product(models.Model):
    name = models.CharField(max_length=255)
    image = models.ImageField(blank=True, upload_to='products')
    price_per_unit = models.DecimalField(max_digits=8, decimal_places=2)
    width = models.CharField(default=None, blank=True, null=True, max_length=20)
    length = models.CharField(default=None, blank=True, null=True, max_length=20)
    height = models.CharField(default=None, blank=True, null=True, max_length=20)
    description = models.TextField(default=None, blank=True, null=True, max_length=None)
    basic_unit = models.CharField(max_length=255)
    tax_percentage = models.DecimalField(max_digits=6, decimal_places=4)
    limited = models.BooleanField()
    in_stock = models.IntegerField()
    active_for_sale = models.BooleanField()
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    objects = ProductManager()

class Sale(models.Model):
    sale_amount = models.DecimalField(max_digits=8, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=4, decimal_places=2)
    shipping_address = models.OneToOneField(Address, on_delete=models.SET_NULL, default=None, blank=True, null=True)
    shipped = models.BooleanField(default=False)
    date_shipped = models.DateTimeField(default=None, blank=True, null=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    objects = SaleManager()

class SaleItem(models.Model):
    quantity_sold = models.IntegerField()
    price_per_unit = models.DecimalField(max_digits=8, decimal_places=2)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    sale = models.ForeignKey(Sale, on_delete=models.SET_NULL, unique=False, default=None, blank=True, null=True)
    product = models.OneToOneField(Product, on_delete=models.SET_NULL, default=None, blank=True, null=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    objects = SaleItemManager()
