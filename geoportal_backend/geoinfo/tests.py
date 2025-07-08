from django.test import TestCase

# Create your tests here.
# Se añadirán pruebas más adelante según el plan.

class SimpleTest(TestCase):
    def test_example(self):
        self.assertEqual(1 + 1, 2)
