const Donation = require('../models/Donation');
const User = require('../models/User');

// @desc    Get platform-wide impact statistics
// @route   GET /api/stats
// @access  Public
const getPlatformStats = async (req, res) => {
  try {
    // 1. Gather all completed donations
    const completedDonations = await Donation.find({ status: 'completed' });

    let totalWeight = 0;
    let totalPeopleHelped = 0;

    completedDonations.forEach((d) => {
      totalWeight += d.weightKg || 0;
      totalPeopleHelped += d.peopleHelped || 0;
    });

    // CO2 savings formula: 2.5 kg of CO2 equivalent emissions prevented per kg of food saved
    const co2Saved = totalWeight * 2.5;

    // 2. Count Active Entities
    const donorCount = await User.countDocuments({ role: 'donor' });
    const ngoCount = await User.countDocuments({ role: 'ngo' });
    const activeListingsCount = await Donation.countDocuments({ status: 'available', expiryTime: { $gt: new Date() } });

    // 3. Top Donors Leaderboard
    const topDonorsAgg = await Donation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$donor',
          totalWeight: { $sum: '$weightKg' },
          totalDonations: { $sum: 1 },
        },
      },
      { $sort: { totalWeight: -1 } },
      { $limit: 5 },
    ]);

    // Populate user names for donors leaderboard
    const topDonors = await Promise.all(
      topDonorsAgg.map(async (item) => {
        const user = await User.findById(item._id).select('name');
        return {
          name: user ? user.name : 'Anonymous Donor',
          totalWeight: item.totalWeight,
          totalDonations: item.totalDonations,
        };
      })
    );

    // 4. Top NGOs Leaderboard
    const topNgosAgg = await Donation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$claimedBy',
          totalPeopleHelped: { $sum: '$peopleHelped' },
          totalPickups: { $sum: 1 },
        },
      },
      { $sort: { totalPeopleHelped: -1 } },
      { $limit: 5 },
    ]);

    // Populate user names for NGOs leaderboard
    const topNgos = await Promise.all(
      topNgosAgg.map(async (item) => {
        const user = await User.findById(item._id).select('name');
        return {
          name: user ? user.name : 'Anonymous NGO/Volunteer',
          totalPeopleHelped: item.totalPeopleHelped,
          totalPickups: item.totalPickups,
        };
      })
    );

    // 5. Food type distribution
    const foodTypeAgg = await Donation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$foodType',
          count: { $sum: 1 },
        },
      },
    ]);

    const foodTypeDistribution = { Veg: 0, 'Non-Veg': 0, Vegan: 0 };
    foodTypeAgg.forEach(item => {
      if (item._id in foodTypeDistribution) {
        foodTypeDistribution[item._id] = item.count;
      }
    });

    res.json({
      success: true,
      stats: {
        totalWeight,
        co2Saved,
        totalPeopleHelped,
        donorCount,
        ngoCount,
        activeListingsCount,
      },
      leaderboards: {
        topDonors,
        topNgos,
      },
      distribution: foodTypeDistribution,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPlatformStats,
};
