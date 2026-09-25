from django.db import models

# ----------------------------
# 1️⃣ Feedback Form Model
# ----------------------------
class FeedBack(models.Model):
    PET_CHOICES = [
        ('dog', 'Dog'),
        ('cat', 'Cat'),
        ('hamster', 'Hamster'),
        ('love-birds', 'Love Birds'),
    ]
    
    PET_HOLDER_CHOICES = [
        ('yes', 'Yes'),
        ('no', 'No'),
    ]
    
    pet_type = models.CharField(max_length=20, choices=PET_CHOICES)
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=10)  # Store as string to preserve leading zeros
    pet_holder = models.CharField(max_length=3, choices=PET_HOLDER_CHOICES)
    message = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.pet_type}"

# ----------------------------
# 2️⃣ Menu Form Model
# ----------------------------
class MenuItem(models.Model):
    VARIETY_CHOICES = [
        ('Sandwich', 'Sandwich'),
        ('Snacks', 'Snacks'),
        ('Beverages', 'Beverages'),
        ('Pizza', 'Pizza'),
        ('Other', 'Other'),
    ]
    
    SNACK_TYPE_CHOICES = [
        ('veg', 'Veg'),
        ('nonveg', 'Non-Veg'),
    ]
    
    variety = models.CharField(max_length=20, choices=VARIETY_CHOICES)
    snack_type = models.CharField(max_length=6, choices=SNACK_TYPE_CHOICES)
    snack_name = models.CharField(max_length=100, blank=True, null=True)
    pizza_name = models.CharField(max_length=100, blank=True, null=True)
    sandwich_name = models.CharField(max_length=100, blank=True, null=True)
    beverage_name = models.CharField(max_length=100, blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.variety} - {self.snack_type}"
