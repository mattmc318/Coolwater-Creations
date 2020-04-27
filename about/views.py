import cwc.settings

from users.models import Person
from .models import Post

from django.shortcuts import render, redirect, reverse
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.core.paginator import Paginator, EmptyPage

POSTS_PER_PAGE = cwc.settings.POSTS_PER_PAGE

def index(request):
    person = Person.objects.get(pk=request.session['id']) if 'id' in request.session else None
    posts = Post.objects.all().order_by('-date_created')
    posts_paginator = Paginator(posts, POSTS_PER_PAGE)

    return render(request, 'about/index.html', {
        'person': person,
        'posts': posts_paginator.page(1).object_list,
    })

def create_post(request):
    Post.objects.create_post(request)

    return redirect(reverse('about:index') + '#updates')


def edit_post(request):
    Post.objects.edit_post(request)

    return redirect(reverse('about:index') + '#updates')


def delete_post(request):
    Post.objects.delete_post(request)

    return redirect(reverse('about:index') + '#updates')

def get_posts(request):
    if request.method == 'GET':
        return Post.objects.get_html(request)

    return HttpResponse(status=500)
