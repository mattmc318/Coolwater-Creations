import cwc.settings

from users.models import Person

from django.db import models
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.core.paginator import Paginator, EmptyPage
from django.core import serializers
from django.shortcuts import render

POSTS_PER_PAGE = cwc.settings.POSTS_PER_PAGE

class PostManager(models.Manager):
    def create_post(self, request):
        title = request.POST['title']
        body = request.POST['body']

        post = Post.objects.create(
            title=title,
            body=body,
        )

        return (True, post)

    def edit_post(self, request):
        id = request.POST['id']
        title = request.POST['title']
        body = request.POST['body']

        try:
            post = Post.objects.get(pk=id)
            post.title = title
            post.body = body
            post.save()
        except Exception as e:
            print(type(e).__name__)
            return (False, None)

        return (True, post)

    def delete_post(self, request):
        id = request.POST['id']

        Post.objects.get(pk=id).delete()

        return True

    def get_html(self, request):
        person = Person.objects.get(pk=request.session['id']) if 'id' in request.session else None
        posts = Post.objects.order_by('-date_created')
        paginator = Paginator(posts, POSTS_PER_PAGE)
        page = request.GET.get('page', 1)

        try:
            current_page = paginator.page(page)
        except EmptyPage:
            return HttpResponse(status=204)

        return render(request, 'about/posts.html', {
            'person': person,
            'posts': current_page,
        })

class Post(models.Model):
    title = models.TextField(max_length=200)
    body = models.TextField(max_length=None)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    objects = PostManager()
