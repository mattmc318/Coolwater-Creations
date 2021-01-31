import re

from django.template import Library
from django.template.defaultfilters import stringfilter

register = Library()

@stringfilter
def spaces(value):
    return re.sub('\s+', ' ', value)
register.filter(spaces)
