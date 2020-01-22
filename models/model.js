const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
	name: {
		type: String
	},
	password: {
		type: String,
		required: [true, "Password is required"]
	},
	email: {
		type: String,
		required: [true, "Email is required"],
		unique: true
	},
	sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sessions'
  }],
	documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'documents'
  }]
});
const Guide = new Schema({
	university: {
		type: String
	},
	grade: {
		type: String
	},
	major: {
		type: String
	}
});
const Client = new Schema({
	information: [{
		type: String
	}]
});

const Session = new Schema({
  title: {
    type: String,
    required: [true, "Title is required."]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: [true, "Creator required."]
  },
  clients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }],
	notes: {
		type: String
	}
});

const Document = new Schema({
  title: {
    type: String,
    required: [true, "Title is required."]
  },
  text: {
		type: String,
		required: [true, "Text is required."]
	}
});

const Users = mongoose.model('users', User);
const Guides = Users.discriminator('guides',Guide);
const Clients = Users.discriminator('clients',Client);
const Sessions = mongoose.model('sessions', Session);
const Documents = mongoose.model('documents', Document);
module.exports = {
	Users: Users,
	Clients: Clients,
	Guides: Guides,
	Sessions: Sessions,
	Documents: Documents,
}
