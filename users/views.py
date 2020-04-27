# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from datetime import datetime

from .models import Person

from django.contrib import messages
from django.shortcuts import render, redirect

def index(request):
    return render(request, 'users/index.html', {'year': datetime.today().year})

def tos(request):
    return render(request, 'users/tos.html', {'year': datetime.today().year})

def privacy(request):
    return render(request, 'users/privacy.html', {'year': datetime.today().year})

def login(request):
    valid, response = Person.objects.login_register(request, 'login')

    if not valid:
        for error in response:
            messages.error(request, error)
        return redirect('gallery:index')

    person = Person.objects.get(pk=response)
    messages.success(request, 'Welcome back, %s!' % person.first_name)
    request.session['id'] = response
    return redirect('gallery:index')

# def register(request):
#     valid, response = Person.objects.login_register(request, 'register')
#
#     if not valid:
#         for error in response:
#             messages.error(request, error)
#         return redirect('gallery:index')
#
#     messages.success(request, 'You have successfully created an account.')
#     request.session['id'] = response
#     return redirect('gallery:index')

def logout(request):
    del request.session['id']

    messages.success(request, 'You have successfully logged out.')
    return redirect('gallery:index')

