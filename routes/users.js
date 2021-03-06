var express = require('express')
var User = require('../models/user');
var Favorite = require('../models/favorite');
var router = express.Router();
const catchErrors = require('../lib/async-error');

function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', 'Please signin first.');
    res.redirect('/');
  }
}

function validateForm(form, options) {
  var name = form.name || "";
  var email = form.email || "";
  name = name.trim();
  email = email.trim();

  if (!name) {
    return 'Name is required.';
  }

  if (!email) {
    return 'Email is required.';
  }

  if (!form.password && options.needPassword) {
    return 'Password is required.';
  }

  if (form.password !== form.password_confirmation) {
    return 'Passsword do not match.';
  }

  if (form.password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return null;
}

router.get('/', needAuth, catchErrors(async (req, res, next) => {
  // if (!currentUser.isAdmin) {
  //   req.flash('danger','권한이 없습니다.');
  //   return res.redirect('back');
  // }
  const users = await User.find({});
  res.render('users/index', {users: users});
}));

router.get('/new', (req, res, next) => {
  res.render('users/new', {messages: req.flash()});
});

router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.render('users/edit', {user: user});
}));

router.get('/:id/favorite', needAuth, catchErrors(async(req,res,next) => {
  const user = await User.findById(req.params.id);
  const favorite = await Favorite.find({author: user._id}).populate('event');
  res.render('users/favorite', {favorite: favorite});
}));

router.put('/:id', needAuth, catchErrors(async (req, res, next) => {
  const err = validateForm(req.body);
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }

  const user = await User.findById({_id: req.params.id});
  if (!user) {
    req.flash('danger', 'Not exist user.');
    return res.redirect('back');
  }

  if (!await user.validatePassword(req.body.password)) {
    req.flash('danger', 'Current password invalid.');
    return res.redirect('back');
  }

  user.name = req.body.name;
  user.email = req.body.email;
  await user.save();
  req.flash('success', 'Updated successfully.');
  res.redirect('/');
}));

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
  const user = await User.findOneAndRemove({_id: req.params.id});
  req.flash('success', 'Deleted Successfully.');
  res.redirect('/');
}));

router.get('/:id', catchErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.render('users/show', {user: user});
}));

router.post('/', catchErrors(async (req, res, next) => {
  var err = validateForm(req.body, {needPassword: true});
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }
  var user = await User.findOne({email: req.body.email});
  console.log('USER???', user);
  if (user) {
    req.flash('danger', 'Email address already exists.');
    return res.redirect('back');
  }
  user = new User({
    name: req.body.name,
    email: req.body.email,
  });
  user.password = await user.generateHash(req.body.password);
  await user.save();
  req.flash('success', 'Registered successfully. Please sign in.');
  res.redirect('/');
}));

router.get('/:id/changePassword', catchErrors(async(req, res, next) => {
  const user = await User.findById(req.params.id);
  res.render('users/change_password', {user: user});
}));

router.put('/:id/changePassword', needAuth, catchErrors(async (req, res, next) => {
  const user = await User.findById({_id: req.params.id});
  // if (!await user.validatePassword(req.body.current_password)) {
  //   req.flash('danger', 'Current password invalid.');
  //   return res.redirect('back');
  // }
  if(!req.body.new_password) {
    req.flash('danger', 'Password is requried.');
    return res.redirect('back');
  }
  if(req.body.new_password !== req.body.new_password_confirmation){
    req.flash('danger', 'Password do not match.');
    return res.redirect('back');
  }
  if(req.body.password.legnth < 6){
    req.flash('danger', 'Password must be at least 6 characters.');
    return res.redirect('back');
  }

  user.password = await user.generateHash(req.body.new_password);
  await user.save(function(err){
    if(err) {next(err)}
    else {
      req.flash('success', 'Updated successfully.');
      res.redirect(`/users/${req.params.id}`);
    }
  })
}));

module.exports = router;
