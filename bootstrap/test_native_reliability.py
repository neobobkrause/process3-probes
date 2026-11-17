import unittest
from native.reliability import CHECKS, assess, concurrent_windows, refill_latency


class ReliabilityTests(unittest.TestCase):
    def test_old_empty_queue_or_clean_pilot_cannot_complete_assessment(self):
        result = assess({})
        self.assertEqual(result['status'], 'assessment_incomplete')
        self.assertEqual(set(result['unfinished']), set(CHECKS))

    def test_confirmed_stop_recovery_block_remains_not_ready_with_other_areas_done(self):
        rows = {key: {'checks': dict.fromkeys(checks, True), 'evidence': 'actual-artifact'}
                for key, checks in CHECKS.items()}
        rows['owner_controls']['checks']['stop_after_replacement'] = False
        rows['owner_controls']['prerequisite'] = {
            'confirmed': True, 'detail': 'supervision holds recovery under owner stop', 'evidence': 'actual rejection'}
        result = assess(rows)
        self.assertEqual(result['status'], 'not_ready')
        self.assertIn('owner_controls', result['confirmed_prerequisites'])

    def test_success_never_drops_browser_or_walk_limits(self):
        rows = {key: {'checks': dict.fromkeys(checks, True), 'evidence': 'actual-artifact'}
                for key, checks in CHECKS.items()}
        rows['multi_round_tranche']['limitations'] = ['No actual walk flaw arose; no live correction loop claimed.']
        result = assess(rows)
        self.assertEqual(result['status'], 'ready_with_recorded_limits')
        self.assertTrue(result['limitations'])
        rows['browser_development_release']['checks']['real_browser'] = False
        self.assertEqual(assess(rows)['status'], 'assessment_incomplete')

    def test_only_distinct_actual_job_processing_intervals_overlap(self):
        rows = [dict(actor='a', job='a', start=10, end=20, evidence='actual-start/end'),
                dict(actor='b', job='b', start=14, end=24, evidence='actual-start/end')]
        self.assertEqual(concurrent_windows(rows)[0]['seconds'], 6)
        rows[1]['start'] = 20
        self.assertEqual(concurrent_windows(rows), [])
        rows[1]['start'] = True
        with self.assertRaises(ValueError): concurrent_windows(rows)

    def test_refill_measures_only_after_both_ready_and_slot_free(self):
        self.assertEqual(refill_latency(ready_at=10, slot_free_at=15, dispatched_at=19)
                         ['ready_with_free_slot_seconds'], 4)
        with self.assertRaises(ValueError): refill_latency(ready_at=10, slot_free_at=15, dispatched_at=14)
