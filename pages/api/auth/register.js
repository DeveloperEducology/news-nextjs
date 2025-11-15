import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  await dbConnect();

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(422).json({ message: 'Missing fields' });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email });
  if (existingUser) {
    return res.status(422).json({ message: 'User already exists' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12); // 12 rounds

  // Create new user
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    role: 'user', // Default role
  });

  try {
    await newUser.save();
    res.status(201).json({ message: 'User created!' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
}