from django.conf.urls import url

from . import views

app_name = 'gallery'

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^gallery$', views.gallery, name='gallery'),
    url(r'^archive$', views.archive, name='archive'),
    url(r'^new_product$', views.new_product, name='new_product'),
    url(r'^upload$', views.upload, name='upload'),
    url(r'^product$', views.product_page, name='product_page'),
    url(r'^edit_product$', views.edit_product, name='edit_product'),
    url(r'^delete_product$', views.delete_product, name='delete_product'),
    url(r'^cart$', views.cart, name='cart'),
    url(r'^add_cart$', views.add_cart, name='add_cart'),
    url(r'^remove_cart$', views.remove_cart, name='remove_cart'),
    url(r'^checkout$', views.checkout, name='checkout'),
    url(r'^shipping$', views.shipping, name='shipping'),
    url(r'^review$', views.review, name='review'),
    url(r'^on_authorize$', views.on_authorize, name='on_authorize'),
    url(r'^order$', views.order, name='order'),
    url(r'^orders$', views.orders, name='orders'),
    url(r'^mark_shipped$', views.mark_shipped, name='mark_shipped'),
    url(r'^delete_sales$', views.delete_sales, name='mark_shipped'),
    url(r'^unsubscribe$', views.unsubscribe, name='unsubscribe'),
    # url(r'^create_gallery_pics$', views.create_gallery_pics, name='create_gallery_pics'),
    # url(r'^clear_all_sessions$', views.clear_all_sessions, name='clear_all_sessions'),
    # url(r'^clear_all_carts$', views.clear_all_carts, name='clear_all_carts'),
]
