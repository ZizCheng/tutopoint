const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
  name: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    // select: false,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
  },
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sessions',
  }],
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'documents',
  }],
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'referrals',
  },
  isVerified: {type: Boolean, default: false},
});
const Guide = new Schema({
  university: {
    type: String,
  },
  grade: {
    type: String,
  },
  major: {
    type: String,
  },
  info: {
    type: String,
  },
  // schedule is sorted based on first index of array
  schedule: [
    [Date, Date],
  ],
  // 5 length array that stores how many 1 star, 2 star, etc. (1 star at index 0)
  ratings: [{
    type: Number,
  }],
  stripeAccountId: {
    type: String,
  },
  onboarded: {
    type: Boolean,
    default: false,
  },
});
const Client = new Schema({
  stripeCustomerId: {
    type: String,
  },
});

const Session = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required.'],
  },
  // guide
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: [true, 'Creator required.'],
  },
  clients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  }],
  notes: {
    type: String,
  },
  date: {
    type: Date,
    required: [true, 'Required is required'],
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  dateCompletedAt: {
    type: Date,
  },
});

const Document = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required.'],
  },
  text: {
    type: String,
    required: [true, 'Text is required.'],
  },
});

const Referrals = new Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  referred: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
  }],
});

const VerifyToken = new Schema({
  for: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
  token: {type: String, required: true},
  createdAt: {type: Date, required: true, default: Date.now, expires: 43200},
});

const Users = mongoose.model('users', User);
const Guides = Users.discriminator('guides', Guide);
const Clients = Users.discriminator('clients', Client);
const Sessions = mongoose.model('sessions', Session);
const Documents = mongoose.model('documents', Document);
const ReferralDocs = mongoose.model('referrals', Referrals);
const VerifyTokens = mongoose.model('verifyTokens', VerifyToken);
module.exports = {
  Users: Users,
  Clients: Clients,
  Guides: Guides,
  Sessions: Sessions,
  Documents: Documents,
  Referrals: ReferralDocs,
  VerifyToken: VerifyTokens,
};
