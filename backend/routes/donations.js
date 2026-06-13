const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonations,
  claimDonation,
  completeDonation,
  cancelDonation,
  getChatMessages,
  sendChatMessage,
} = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .post(protect, authorize('donor'), createDonation)
  .get(protect, getDonations);

router.put('/:id/claim', protect, authorize('ngo'), claimDonation);
router.put('/:id/complete', protect, completeDonation);
router.put('/:id/cancel', protect, cancelDonation);

router.route('/:id/messages')
  .get(protect, getChatMessages)
  .post(protect, sendChatMessage);

module.exports = router;
