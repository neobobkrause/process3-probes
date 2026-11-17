"""Interaction instructions apply to every retained role; no live proof claim."""
import unittest
import role_instructions as r

class RoleInteractionInstructionsTests(unittest.TestCase):
    def test_all_roles_distinguish_completion_replacement_and_retirement(self):
        for role in r.RULES:
            with self.subTest(role=role):
                text=r.text(role)
                self.assertIn('genuinely interactive retained session',text)
                self.assertIn('explicit logical-role retirement',text)
                self.assertIn('probe the known binding',text)
                self.assertIn('acknowledgments are not substantive answers',text)
                self.assertIn('clearly labeled agent proxy tests',text)
                self.assertIn('independent child-session UI',text)
                self.assertIn('not grants',text)
