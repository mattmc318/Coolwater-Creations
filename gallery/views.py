# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import os
import base64
import requests
import json
import braintree
#import taxjar

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

# TAXJAR_API_KEY = os.environ.get('TAXJAR_API_KEY')
# client = taxjar.Client(api_key=TAXJAR_API_KEY)

MAILGUN_API_KEY = cwc.settings.MAILGUN_API_KEY

PRODUCTS_PER_PAGE = cwc.settings.PRODUCTS_PER_PAGE

def index(request):
    products = Product.objects.filter(in_stock__gte=1).order_by('-date_created')
    archive = Product.objects.filter(in_stock=0).order_by('-date_created')
    person = Person.objects.get(pk=request.session['id']) if 'id' in request.session else None
    products_paginator = Paginator(products, PRODUCTS_PER_PAGE)
    archive_paginator = Paginator(archive, PRODUCTS_PER_PAGE)
    filters = Product.objects.get_filters()

    # messages.error(request, 'We are currently experiencing technical difficulties with our checkout system. If you would like to make a purchase, please contact Michaele at +1 (269) 251-0267 or michaele@coolwatercreations.com.')

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
    person = Person.objects.get(
        pk=request.session['id']) if 'id' in request.session else None

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
    # tax = (subtotal + shipping) * Decimal(0.060000)
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

def shipping(request):
    valid, response = Address.objects.store_address(request)

    if not valid:
        for error in response:
            messages.error(request, error)
        return redirect('gallery:checkout')

    return redirect('gallery:review')

def review(request):
    shipping_address = request.session['shipping_address']
    products = Product.objects.get_cart(request)
    subtotal = Decimal(0.00)

    # postalCode = '{}-{}'.format(shipping_address['postalCode'], shipping_address['postalCodeExt']) if shipping_address['countryCode'] == 'US' else shipping_address['postalCode']
    # rates = client.rates_for_location(postalCode, {
    #     'street': shipping_address['line1'],
    #     'city': shipping_address['city'],
    #     'state': shipping_address['state'],
    #     'country': shipping_address['countryCode'],
    # })
    # tax_rate = rates['combined_rate']
    tax_rate = 0

    for product in products:
        subtotal += product.price_per_unit

    shipping = Decimal(8.00)
    tax = (subtotal + shipping) * Decimal(tax_rate)
    total = subtotal + shipping + tax

    context = {
        'DEBUG': cwc.settings.DEBUG,
        'shipping_address': shipping_address,
        'products': products,
        'subtotal': subtotal,
        'shipping': '{:0.2f}'.format(shipping),
        'tax_rate': '{:0.3f}'.format(tax_rate * 100),
        'tax': '{:0.2f}'.format(tax),
        'total': '{:0.2f}'.format(total),
        'sandbox_token': SANDBOX_GATEWAY.client_token.generate(),
        'production_token': PRODUCTION_GATEWAY.client_token.generate(),
    }

    return render(request, 'gallery/review.html', context)

def order_confirm(
    shipping_address,
    sale_items,
    subtotal,
    shipping,
    tax,
    total
    ):
    html = '<!DOCTYPE html>\
<html lang="en">\
<head>\
    <meta charset="UTF-8">\
    <meta name="viewport" content="width=device-width, initial-scale=1.0">\
    <meta http-equiv="X-UA-Compatible" content="ie=edge">\
    <title>Coolwater Creations</title>\
    <style>\
    @import url("https://fonts.googleapis.com/css?family=Open+Sans");\
    * {\
        font-family: "Open Sans", Helvetica, Arial, sans-serif;\
    }\
    .background {\
        background-color: #e6ebf0;\
    }\
    .container {\
        margin: 0 auto;\
        max-width: 700px;\
    }\
    .shipping-confirm {\
        position: relative;\
        width: 100%;\
        margin-bottom: 1rem;\
        padding: 1rem;\
        background-color: white;\
        border: 1px solid #ced4da;\
        border-radius: 4px;\
    }\
    .shipping-confirm table {\
        width: 100%;\
    }\
    .shipping-confirm td {\
        width: 50%;\
        white-space: nowrap; \
        overflow: hidden;\
        text-overflow: ellipsis;\
    }\
    .shipping-confirm td:first-child {\
        text-align: right;\
        padding-right: 1rem;\
        font-style: italic;\
    }\
    ul {\
        padding-left: 0;\
    }\
    ul li {\
        list-style: none;\
    }\
        ul li img {\
        width: 100%;\
    }\
    .product {\
        display: flex;\
    }\
    .product,\
    .total {\
        margin-top: 0.5rem;\
        padding: 1rem;\
        background-color: white;\
        border: 1px solid #ced4da;\
        border-radius: 4px;\
    }\
    .total h5 {\
        margin: 0;\
    }\
    .total table {\
        width: 100%;\
    }\
    .total tr:nth-last-child(n+3) {\
        border-bottom: 1px solid #ced4da;\
    }\
    .total tr:last-child {\
        border-top: 3px double #ced4da;\
    }\
    .total td {\
        margin: 0.5rem 0;\
    }\
    .total td:last-child {\
        float: right;\
    }\
    .product .img-container {\
        background-color: #343a40;\
        border: 1px solid #343a40;\
        box-sizing: unset;\
        height: 128px;\
        width: 128px;\
        flex: 0 0 auto;\
    }\
    .product .img-container img {\
        display: block;\
        max-height: 128px;\
        max-width: 128px;\
        width: auto;\
        height: auto;\
    }\
    .name-price-container {\
        margin: 0 1rem;\
        display: flex;\
        flex: 1 1 auto;\
        flex-direction: column;\
        justify-content: center;\
        min-width: 0;\
    }\
    .name-price-container span {\
        display: block;\
    }\
    .name-price-container a {\
        display: block;\
        white-space: nowrap;\
        overflow: hidden;\
        text-overflow: ellipsis;\
    }\
    .name-price-container a,\
    .name-price-container a:hover {\
        color: #212529;\
    }\
    .name-price-container-checkout span {\
        margin: 0;\
        height: 1em;\
        line-height: 1em;\
        white-space: nowrap;\
    }\
    .name-price-container-checkout span:first-of-type {\
        float: left;\
    }\
    .name-price-container-checkout span:last-of-type {\
        float: right;\
    }\
    </style>\
</head>\
'
    html += '<body>\
    <div class="background">\
        <div class="container">\
            <a href="https://coolwatercreations.com/">\
                <h1>Coolwater Creations</h1>\
            </a>\
            <h5>Shipping Address</h5>\
            <div class="shipping-confirm">\
                <table>\
                    <tbody>\
                        <tr>\
                            <td>Name</td>\
                            <td>{}</td>\
                        </tr>\
                        <tr>\
                            <td>Address</td>\
                            <td>{}</td>\
                        </tr>\
'.format(shipping_address.recipientName, shipping_address.line1)
    if shipping_address.line2:
        html += '                        <tr>\
                            <td></td>\
                            <td>{}</td>\
                        </tr>\
'.format(shipping_address.line2)
    html += '                        <tr>\
                            <td>City</td>\
                            <td>{}</td>\
                        </tr>\
'.format(shipping_address.city)
    if shipping_address.state:
        html += '                        <tr>\
                            <td>State/Province</td>\
                            <td>{}</td>\
                        </tr>\
'.format(shipping_address.state)
    if shipping_address.postalCode:
        html += '                        <tr>\
                            <td>Zip Code</td>\
                            <td>{}</td>\
                        </tr>\
'.format(shipping_address.postalCode)
    html += '                        <tr>\
                            <td>Country Code</td>\
                            <td>{}</td>\
                        </tr>\
                        <tr>\
                            <td>Phone</td>\
                            <td>{}</td>\
                        </tr>\
                        <tr>\
                            <td>Email</td>\
                            <td>{}</td>\
                        </tr>\
                    </tbody>\
                </table>\
            </div>\
'.format(shipping_address.countryCode, shipping_address.phone, shipping_address.email)
    html += '            <h5>Products Ordered</h5>\
            <ul>\
'
    for sale_item in sale_items:
        html += '            <li class="row product">\
                <div class="name-price-container-checkout">\
                    <span>{}</span>\
                    <span>${}</span>\
                </div>\
            </li>\
'.format(sale_item.product.name, sale_item.product.price_per_unit)
    html += '                <li class="row total">\
                    <table>\
                        <tbody>\
                            <tr>\
                                <td>\
                                    <span>Subtotal</span>\
                                </td>\
                                <td>\
                                    <span>${}</span>\
                                </td>\
                            </tr>\
                            <tr>\
                                <td>\
                                    <span>Shipping</span>\
                                </td>\
                                <td>\
                                    <span>${}</span>\
                                </td>\
                            </tr>\
                            <tr>\
                                <td>\
                                    <span>Tax</span>\
                                </td>\
                                <td>\
                                    <span>${}</span>\
                                </td>\
                            </tr>\
                            <tr>\
                                <td>\
                                    <span>Total</span>\
                                </td>\
                                <td>\
                                    <span>${}</span>\
                                </td>\
                            </tr>\
                        </tbody>\
                    </table>\
                </li>\
            </ul>\
        </div>\
    </div>\
</body>\
</html>\
'.format(subtotal, shipping, tax, total)

    return requests.post(
        "https://api.mailgun.net/v3/mg.coolwatercreations.com/messages",
        auth=("api", MAILGUN_API_KEY),
        data={
            "from": "Coolwater Creations <donotreply@coolwatercreations.com>",
            "to": [shipping_address.email],
            "subject": "Coolwater Creations - Order Confirmation",
            "text": "Enable HTML to view order confirmation.",
            "html": html,
        }
    )

def on_authorize(request):
    if cwc.settings.DEBUG:
        result = SANDBOX_GATEWAY.transaction.sale({
            "amount": request.POST["sale_amount"],
            "payment_method_nonce": request.POST["payment_method_nonce"],
            "options": {
                "submit_for_settlement": True,
                "store_in_vault_on_success": True,
            }
        })
    else:
        result = PRODUCTION_GATEWAY.transaction.sale({
            "amount": request.POST["sale_amount"],
            "payment_method_nonce": request.POST["payment_method_nonce"],
            "options": {
                "submit_for_settlement": True,
                "store_in_vault_on_success": True,
            }
        })

    if result.is_success:
        valid, response = Sale.objects.create_sale(request)

        if not valid:
            return JsonResponse({'success': False})

        total = request.POST["sale_amount"]
        tax = request.POST["tax_amount"]
        shipping = Decimal(8.00)
        subtotal = Decimal(total) - Decimal(tax) - shipping

        order_confirm(
            response.shipping_address,
            SaleItem.objects.filter(sale=response),
            subtotal,
            '{:0.2f}'.format(shipping),
            tax,
            total
        )

        return JsonResponse({'success': True})

    return JsonResponse({'success': False})

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
    return JsonResponse({'success': Sale.objects.mark_shipped(request)})

def delete_sales(request):
    Sale.objects.delete_sales(request)

    return JsonResponse({'success': True})

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
