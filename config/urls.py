"""Configurazione URL per il progetto HUSTLER LUXURY.

Routes:
- admin/  -> Django admin
- /       -> include di shop.urls
- media/  -> servizio media in DEBUG (immagini prodotto)
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('shop.urls', namespace='shop')),
]

# Serviamo i media caricati (ImageField prodotti) in ambiente di sviluppo.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
