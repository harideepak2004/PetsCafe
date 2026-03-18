from django.urls import path
from .import views

urlpatterns=[
    path('',views.index, name='index'),
    path('About/',views.About,name='About'),
    path('FeedBack/', views.FeedBack_view, name='FeedBack'),
    path('Menu/', views.Menu_view, name='Menu'),
    path('FeedBack-success/', views.FeedBack_success, name='FeedBack_success'),
    path('Menu-success/', views.Menu_success, name='Menu_success'),
    
]