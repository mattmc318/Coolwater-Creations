# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import os
import base64
import requests
import json
import braintree

import cwc.settings

from decimal import Decimal
from datetime import datetime

from django.contrib import messages
from django.shortcuts import render, redirect
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.core.paginator import Paginator, EmptyPage
from .models import Product, Address, Sale, SaleItem
from users.models import Person

SANDBOX_GATEWAY = braintree.BraintreeGateway(
    access_token=cwc.settings.BRAINTREE_ACCESS_TOKEN_SANDBOX)
PRODUCTION_GATEWAY = braintree.BraintreeGateway(
    access_token=cwc.settings.BRAINTREE_ACCESS_TOKEN_PRODUCTION)

MAILGUN_API_KEY = cwc.settings.MAILGUN_API_KEY

PRODUCTS_PER_PAGE = cwc.settings.PRODUCTS_PER_PAGE

def index(request):
    products = Product.objects.filter(in_stock__gte=1).order_by('-date_created')
    archive = Product.objects.filter(in_stock=0).order_by('-date_created')
    person = Person.objects.get(pk=request.session['id']) if 'id' in request.session else None
    products_paginator = Paginator(products, PRODUCTS_PER_PAGE)
    archive_paginator = Paginator(archive, PRODUCTS_PER_PAGE)
    filters = Product.objects.get_filters()

    context = {
        'products': products_paginator.page(1).object_list,
        'archive': archive_paginator.page(1).object_list,
        'person': person,
        'filters': filters,
    }
    return render(request, 'gallery/index.html', context)

def gallery(request):
    return Product.objects.get_html(request, 'gallery')

def archive(request):
    return Product.objects.get_html(request, 'archive')

def new_product(request):
    return render(request, 'gallery/new_product.html')

def upload(request):
    valid, response = Product.objects.create_product(request)

    if not valid:
        for error in response:
            messages.error(request, error)
    else:
        messages.success(request, 'Product uploaded successfully.')
        return HttpResponseRedirect('/gallery%s' % ('/#archive' if request.POST.get('archive', 'False') == 'True' else ''))

    return redirect('gallery:new_product')

def product_page(request):
    id = int(request.GET['id'])
    product = Product.objects.get(pk=id)
    person = Person.objects.get(pk=request.session['id']) \
        if 'id' in request.session else None

    context = {
        'product': product,
        'person': person,
    }
    return render(request, 'gallery/product.html', context)

def edit_product(request):
    id = request.POST.get('id', None)
    valid, response = Product.objects.edit_product(request)

    if not valid:
        for error in response:
            messages.error(request, error)
    else:
        messages.success(request, 'Product updated successfully.')

    return HttpResponseRedirect('/gallery/product?id=' + id)

def delete_product(request):
    Product.objects.delete_product(request)

    return redirect('gallery:index')

def create_gallery_pics(request):
    Product.objects.create_gallery_pics()

    return HttpResponse('Gallery pics created.')

def cart(request):
    products = Product.objects.get_cart(request)

    context = {
        'products': products,
    }
    return render(request, 'gallery/cart.html', context)

def add_cart(request):
    id = int(request.POST['id'])

    cart = request.session.get('cart', [])
    cart.append(id)
    request.session['cart'] = cart

    return redirect('gallery:cart')

def remove_cart(request):
    id = int(request.POST['id'])

    cart = request.session.get('cart', [])
    cart.remove(id)
    request.session['cart'] = cart

    return redirect('gallery:cart')

def checkout(request):
    products = Product.objects.get_cart(request)
    subtotal = Decimal(0.00)

    try:
        shipping_address = request.session['shipping_address']
    except KeyError:
        shipping_address = None

    for product in products:
        subtotal += product.price_per_unit

    shipping = Decimal(8.00)
    tax = 0
    total = subtotal + shipping + tax

    context = {
        'shipping_address': shipping_address,
        'products': products,
        'subtotal': subtotal,
        'shipping': '{:0.2f}'.format(shipping),
        'tax': '{:0.2f}'.format(tax),
        'total': '{:0.2f}'.format(total),
    }

    return render(request, 'gallery/checkout.html', context)

def on_approve(request):
    details = json.loads(request.POST.get('details'))
    email = details['payer']['email_address']

    sales = []
    for purchase in details['purchase_units']:
        address = purchase['shipping']['address']
        name = purchase['shipping']['name']['full_name']

        sale = Sale.objects.create(
            sale_amount=Decimal(purchase['amount']['value']),
            tax_amount=0,
            shipping_address=Address.objects.create(
                recipientName=name,
                line1=address['address_line_1'],
                line2=address.get('address_line_2', ''),
                city=address['admin_area_2'],
                countryCode=address['country_code'],
                postalCode=address['postal_code'],
                state=address['admin_area_1'],
                email=email,
                subscribed=False,
            )
        )

        for product in Product.objects.get_cart(request):
            SaleItem.objects.create(
                quantity_sold=1,
                price_per_unit=product.price_per_unit,
                price=product.price_per_unit,
                sale=sale,
                product=product,
            )

            Product.objects.mark_product_sold(product.pk)

    Product.objects.clear_cart(request)

    return HttpResponse(status=200)

def order(request):
    sale = Sale.objects.get(pk=request.GET['id'])
    return render(request, 'gallery/order.html', {
        'sale': sale,
        'sale_items': SaleItem.objects.filter(sale=sale),
    })

def orders(request):
    return render(request, 'gallery/orders.html', {
        'pending_sales': Sale.objects.filter(shipped=0).order_by('-date_updated'),
        'shipped_sales': Sale.objects.filter(shipped=1).order_by('-date_shipped'),
    })

def mark_shipped(request):
    Sale.objects.mark_shipped(request)

    return HttpResponse()

def delete_sales(request):
    Sale.objects.delete_sales(request)

    return HttpResponse()

def unsubscribe(request):
    return HttpResponse('You have successfully unsubscribed. (but not really)')

######################
# FOR DEBUG USE ONLY #
######################

from django.http import HttpResponse
from datetime import datetime
from django.contrib.sessions.models import Session
from django.contrib.sessions.backends.db import SessionStore

def clear_all_sessions(request):
    Session.objects.all().delete()

    return HttpResponse('All sessions cleared.')

def clear_all_carts(request):
    active_sessions = Session.objects.filter(expire_date__gte=datetime.now())
    for session in active_sessions:
        user_session = SessionStore(session_key=session.session_key)
        try:
            del user_session['cart']
            user_session.save()
        except KeyError:
            pass

    return HttpResponse('All carts cleared.')
