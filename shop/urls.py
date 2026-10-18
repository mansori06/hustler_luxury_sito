"""URL dell'app shop.

Mappa ogni pagina HTML originale a una vista Django con nome, così i
template possono usare {% url 'nome' %} nei collegamenti.
"""
from django.urls import path

from . import views

app_name = 'shop'

urlpatterns = [
    path('', views.index, name='index'),
    path('prodotti/', views.collection, name='collection'),
    path('prodotto/<slug:slug>/', views.product_detail, name='product_detail'),
    path('carrello/', views.cart_view, name='cart'),
    path('privacy/', views.privacy, name='privacy'),
    path('termini/', views.termini, name='termini'),
    path('resi/', views.resi, name='resi'),
    path('recesso/', views.recesso, name='recesso'),
]
