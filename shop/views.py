"""Viste dell'app shop — una per ogni pagina HTML originale."""
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render

from .models import Product


def robots_txt(request):
    return HttpResponse(
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin/\n"
        "Disallow: /carrello/\n"
        "Sitemap: https://hustlerluxury.pythonanywhere.com/sitemap.xml\n",
        content_type='text/plain'
    )


def _categorie_disponibili():
    """Categorie distinte (per pulsanti filtro)."""
    return list(Product.objects.values_list('categoria', flat=True).distinct())


def index(request):
    """Homepage: slider hero + sezioni. I prodotti sono resi dal JS usando i
    dati globali products_json (forniti dal context processor)."""
    hero_slugs = ['prod-01', 'prod-02', 'prod-03', 'prod-04']
    hero = Product.objects.filter(slug__in=hero_slugs).in_bulk(hero_slugs, field_name='slug')
    ctx = {'categorie': _categorie_disponibili()}
    # p1..p4 usati dallo slider hero (img product)
    ctx.update({'p1': hero.get('prod-01'), 'p2': hero.get('prod-02'),
                'p3': hero.get('prod-03'), 'p4': hero.get('prod-04')})
    return render(request, 'shop/index.html', ctx)


def collection(request):
    """Pagina collezione /shop: prodotti resi con {% for product in products %}.
    Filtro/cerca/ordinamento avvengono client-side sul DOM."""
    products = Product.objects.filter(available=True)
    return render(request, 'shop/collezione.html', {
        'products': products,
        'categorie': _categorie_disponibili(),
        'cat_attiva': request.GET.get('cat', 'all'),
    })


def product_detail(request, slug):
    """Dettaglio prodotto /prodotto/<slug>/."""
    product = get_object_or_404(Product, slug=slug, available=True)
    return render(request, 'shop/prodotto.html', {'product': product})


def cart_view(request):
    """Carrello: i dati sono in localStorage, la pagina è struttura + JS."""
    return render(request, 'shop/carrello.html')


def privacy(request):
    return render(request, 'shop/privacy.html')


def termini(request):
    return render(request, 'shop/termini.html')


def resi(request):
    return render(request, 'shop/resi.html')


def recesso(request):
    return render(request, 'shop/recesso.html')
