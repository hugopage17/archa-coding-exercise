from django.urls import path
from .views import (
    CategoryListCreateView,
    CategoryUpdateView,
    CategoryCodeListCreateView,
    CodeUpdateView,
)

urlpatterns = [
    path("categories/", CategoryListCreateView.as_view()),
    path("categories/<uuid:pk>/", CategoryUpdateView.as_view()),
    path("categories/<uuid:pk>/codes/", CategoryCodeListCreateView.as_view()),
    path("codes/<uuid:pk>/", CodeUpdateView.as_view()),
]