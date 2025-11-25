from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta

# Create your models here.

class Task(models.Model):

    CATEGORY_CHOICES = [
        ('General', 'General'),
        ('Personal', 'Personal'),
        ('Work', 'Work'),
        ('Education', 'Education'),
        ('Health', 'Health'),
        ('Finance', 'Finance'),
    ]

    STATUS_CHOICES = [
        ('To-Do', 'To-Do'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed')
    ]

    title = models.CharField(max_length=256)
    description = models.TextField(blank=True, null=True)

    category = models.CharField(max_length=64, choices=CATEGORY_CHOICES, default='General')
    status = models.CharField(max_length=64, choices=STATUS_CHOICES, default='Pending')
    
    dueDate = models.DateField()
    dueTime = models.TimeField()
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
    @property
    def is_due_soon(self):
        if self.status == 'Completed':
            return False
        
        dt_combine = datetime.combine(self.dueDate, self.dueTime)
        
        if timezone.is_aware(timezone.now()):
            dt_aware = timezone.make_aware(dt_combine)
        else:
            dt_aware = dt_combine

        now = timezone.now()
        diff = dt_aware - now

        return timedelta(seconds=0) < diff < timedelta(hours=24)
    
@property
def is_overdue(self):
    if self.status == 'Completed':
        return False
    
    dt_combine = datetime.combine(self.dueDate, self.dueTime)

    if timezone.is_aware(timezone.now()):
        dt_aware = timezone.make_aware(dt_combine)
    else:
        dt_aware = dt_combine

    return timezone.now() > dt_aware