"""Configurazione sitemap per HUSTLER LUXURY.

-include pagina: sitemap.xml (route in config/urls.py)
-include modello: shop.product

Genera:
- pagine statiche (home, collezione, privacy, termini, resi, recesso)
- una voce per ogni Product disponibile
"""
from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from .models import Product


class StaticViewSitemap(Sitemap):
    protocol = 'https'
    changefreq = 'weekly'
    priority = 0.7

    def items(self):
        return ['shop:index', 'shop:collection', 'shop:privacy',
                'shop:termini', 'shop:resi', 'shop:recesso']

    def location(self, item):
        return reverse(item)


class ProductSitemap(Sitemap):
    protocol = 'https'
    changefreq = 'weekly'
    priority = 0.9

    def items(self):
        return Product.objects.filter(available=True)

    def location(self, item):
        return reverse('shop:product_detail', args=[item.slug])


sitemaps = {
    'pages': StaticViewSitemap,
    'products': ProductSitemap,
}
