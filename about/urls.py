from django.conf.urls import url

from . import views

app_name = 'about'

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^create_post$', views.create_post, name='create_post'),
    url(r'^edit_post$', views.edit_post, name='edit_post'),
    url(r'^delete_post$', views.delete_post, name='delete_post'),
    url(r'^get_posts$', views.get_posts, name='get_posts'),
]
