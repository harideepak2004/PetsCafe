from django import forms
from .models import FeedBack, MenuItem

# --------------------------
# Feedback Form
# --------------------------
class FeedBackForm(forms.ModelForm):
    class Meta:
        model = FeedBack
        fields = ['pet_type', 'name', 'email', 'phone', 'pet_holder', 'message']
        widgets = {
            'pet_type': forms.Select(attrs={'class': 'form-control'}),
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter your name'}),
            'email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Enter your email'}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Enter your phone number'}),
            'pet_holder': forms.RadioSelect(),
            'message': forms.Textarea(attrs={'class': 'form-control', 'placeholder': 'Share your thoughts...'}),
        }

# --------------------------
# Menu Form
# --------------------------
class MenuItemForm(forms.ModelForm):
    class Meta:
        model = MenuItem
        fields = ['variety', 'snack_type', 'snack_name', 'pizza_name', 'sandwich_name', 'beverage_name']
        widgets = {
            'variety': forms.Select(attrs={'class': 'form-control'}),
            'snack_type': forms.RadioSelect(),
            'snack_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Egg puffs'}),
            'pizza_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Cheese Volcano'}),
            'sandwich_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Chicken cheese'}),
            'beverage_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Cold coffee'}),
        }
