const Donation = require('../models/Donation');

// @desc    Create new donation listing
// @route   POST /api/donations
// @access  Private (Donor only)
const createDonation = async (req, res) => {
  try {
    const { foodName, quantity, weightKg, foodType, expiryTime, address, latitude, longitude } = req.body;

    const donation = await Donation.create({
      donor: req.user._id,
      foodName,
      quantity,
      weightKg: parseFloat(weightKg) || 0,
      foodType: foodType || 'Veg',
      expiryTime,
      address,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });

    // Notify all NGOs of a new listing nearby in real-time
    const io = req.app.get('io');
    if (io) {
      io.to('ngos').emit('newDonation', {
        ...donation.toJSON(),
        donor: {
          _id: req.user._id,
          name: req.user.name,
          phone: req.user.phone,
          address: req.user.address,
        }
      });
    }

    res.status(201).json({ success: true, data: donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get donation listings
// @route   GET /api/donations
// @access  Private
const getDonations = async (req, res) => {
  try {
    const query = {};

    // Donors can only see their own listings
    if (req.user.role === 'donor') {
      query.donor = req.user._id;
    } else if (req.user.role === 'ngo') {
      // NGO can filter
      const { status, claimedByMe, lat, lng, maxDistance } = req.query;
      
      if (claimedByMe === 'true') {
        query.claimedBy = req.user._id;
      }

      if (status) {
        query.status = { $in: status.split(',') };
      }

      // Geospatial sorting index query (accurate distances)
      if (lat && lng) {
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)], // [longitude, latitude]
            },
            $maxDistance: (parseFloat(maxDistance) || 15) * 1000, // max distance in meters (default 15km)
          },
        };
      }
    }

    // Populate info for details
    let dbQuery = Donation.find(query)
      .populate('donor', 'name email phone address')
      .populate('claimedBy', 'name email phone');

    // Only sort by date if not doing proximity $near search
    if (!query.location) {
      dbQuery = dbQuery.sort({ createdAt: -1 });
    }

    const donations = await dbQuery;

    res.json({ success: true, count: donations.length, data: donations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Claim / Reserve an available donation
// @route   PUT /api/donations/:id/claim
// @access  Private (NGO only)
const claimDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Donation is no longer available' });
    }

    // Check if donation has already expired
    if (new Date(donation.expiryTime) < new Date()) {
      return res.status(400).json({ success: false, message: 'Donation has expired' });
    }

    donation.status = 'requested';
    donation.claimedBy = req.user._id;
    donation.claimedAt = Date.now();

    await donation.save();

    // Populate donor and claimedBy information before returning
    await donation.populate([
      { path: 'donor', select: 'name email phone address' },
      { path: 'claimedBy', select: 'name email phone' }
    ]);

    // Notify the donor in real-time that their listing has been claimed with NGO details
    const io = req.app.get('io');
    if (io) {
      io.to(donation.donor._id.toString()).emit('donationClaimed', donation);
    }

    res.json({ success: true, message: 'Donation claimed successfully', data: donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete donation pickup (NGO confirms)
// @route   PUT /api/donations/:id/complete
// @access  Private (NGO or Donor)
const completeDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const donorId = donation.donor?._id ? donation.donor._id.toString() : donation.donor?.toString();
    const claimedById = donation.claimedBy?._id ? donation.claimedBy._id.toString() : donation.claimedBy?.toString();
    const userId = req.user._id.toString();

    // Only the donor or the NGO who claimed it can complete it
    const isDonor = donorId === userId;
    const isClaimedNGO = claimedById === userId;

    if (!isDonor && !isClaimedNGO) {
      return res.status(403).json({ success: false, message: 'Not authorized to complete this transaction' });
    }

    const { peopleHelped } = req.body;

    donation.status = 'completed';
    donation.peopleHelped = parseInt(peopleHelped) || 0;
    donation.completedAt = Date.now();

    await donation.save();

    // Broadcast completed status in real-time
    const io = req.app.get('io');
    if (io) {
      io.to(donation._id.toString()).emit('donationStatusChanged', {
        donationId: donation._id,
        status: 'completed',
        peopleHelped: donation.peopleHelped,
        claimedBy: claimedById,
      });
      io.to(donorId).emit('donationCompleted', { donationId: donation._id });
      if (claimedById) {
        io.to(claimedById).emit('donationCompleted', { donationId: donation._id });
      }
    }

    res.json({ success: true, message: 'Donation marked as completed', data: donation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel claim or delete listing
// @route   PUT /api/donations/:id/cancel
// @access  Private
const cancelDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    const donorId = donation.donor?._id ? donation.donor._id.toString() : donation.donor?.toString();
    const claimedById = donation.claimedBy?._id ? donation.claimedBy._id.toString() : donation.claimedBy?.toString();
    const userId = req.user._id.toString();

    const isDonor = donorId === userId;
    const isClaimedNGO = claimedById === userId;

    if (!isDonor && !isClaimedNGO) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this donation' });
    }

    if (isDonor) {
      // Donor can cancel listing at any time (changes to cancelled)
      if (donation.status === 'completed') {
        return res.status(400).json({ success: false, message: 'Cannot cancel a completed donation' });
      }
      donation.status = 'cancelled';
      await donation.save();

      const io = req.app.get('io');
      if (io) {
        io.emit('donationStatusChanged', {
          donationId: donation._id,
          status: 'cancelled',
          claimedBy: claimedById || null
        });
      }

      return res.json({ success: true, message: 'Listing cancelled by donor', data: donation });
    }

    if (isClaimedNGO) {
      // NGO cancels claim: reverts to available
      if (donation.status !== 'requested' && donation.status !== 'accepted') {
        return res.status(400).json({ success: false, message: 'Cannot release this claim in current state' });
      }
      donation.status = 'available';
      donation.claimedBy = null;
      donation.claimedAt = null;
      await donation.save();
      
      // Notify donor and all NGOs of release in real-time
      const io = req.app.get('io');
      if (io) {
        io.emit('donationStatusChanged', {
          donationId: donation._id,
          status: 'available',
          claimedBy: null
        });
        io.to(donorId).emit('donationReleased', {
          donationId: donation._id,
          foodName: donation.foodName,
        });
        io.to('ngos').emit('donationReleasedGlobal', {
          ngoName: req.user.name,
          releasingNgoId: req.user._id,
          foodName: donation.foodName,
          donationId: donation._id
        });
      }

      return res.json({ success: true, message: 'Claim released, donation is available again', data: donation });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get chat messages for a claimed donation
// @route   GET /api/donations/:id/messages
// @access  Private
const getChatMessages = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('chatMessages.sender', 'name role');

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    // Verify authorized user (donor or NGO client)
    const isDonor = donation.donor.toString() === req.user._id.toString();
    const isNGO = donation.claimedBy && donation.claimedBy.toString() === req.user._id.toString();

    if (!isDonor && !isNGO) {
      return res.status(403).json({ success: false, message: 'Not authorized to view messages' });
    }

    res.json({ success: true, data: donation.chatMessages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send chat message for coordination
// @route   POST /api/donations/:id/messages
// @access  Private
const sendChatMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    // Verify authorized user
    const isDonor = donation.donor.toString() === req.user._id.toString();
    const isNGO = donation.claimedBy && donation.claimedBy.toString() === req.user._id.toString();

    if (!isDonor && !isNGO) {
      return res.status(403).json({ success: false, message: 'Not authorized to send messages' });
    }

    const newMessage = {
      sender: req.user._id,
      text,
      createdAt: Date.now(),
    };

    donation.chatMessages.push(newMessage);
    await donation.save();

    const populatedMsg = {
      _id: donation.chatMessages[donation.chatMessages.length - 1]._id,
      sender: {
        _id: req.user._id,
        name: req.user.name,
        role: req.user.role,
      },
      text,
      createdAt: newMessage.createdAt,
    };

    // Emit live socket event to the donation room
    const io = req.app.get('io');
    if (io) {
      io.to(donation._id.toString()).emit('chatMessage', populatedMsg);
    }

    res.json({ success: true, data: populatedMsg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDonation,
  getDonations,
  claimDonation,
  completeDonation,
  cancelDonation,
  getChatMessages,
  sendChatMessage,
};
