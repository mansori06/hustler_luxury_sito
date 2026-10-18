"""Registrazione dei modelli nell'admin di Django."""
from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'categoria', 'price', 'prezzo_barrato',
                    'novita', 'available', 'discount', 'created_at')
    list_filter = ('categoria', 'novita', 'available', 'created_at')
    search_fields = ('name', 'slug', 'categoria')
    readonly_fields = ('discount',)
    ordering = ('-created_at',)
