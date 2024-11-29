import prisma from './lib/prisma'
import { randomUUID } from 'crypto'

// Define interfaces for type safety
interface IndianNames {
  male: string[];
  female: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  friendIds: string[];
  requestSent: string[];
  requestReceived: string[];
  image: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: Date | null;
}

// Comprehensive lists of Indian names
const indianFirstNames: IndianNames = {
  male: [
    'Aarav', 'Vivaan', 'Aditya', 'Ishaan', 'Arjun', 
    'Vihaan', 'Reyansh', 'Krishna', 'Atharva', 'Ayaan',
    'Rohan', 'Karthik', 'Raj', 'Vikram', 'Amit'
  ],
  female: [
    'Priya', 'Ananya', 'Ishita', 'Aisha', 'Myra',
    'Aarohi', 'Saanvi', 'Navya', 'Dia', 'Anvi',
    'Divya', 'Shreya', 'Meera', 'Riya', 'Kavya'
  ]
}

const indianLastNames: string[] = [
  'Patel', 'Singh', 'Kumar', 'Sharma', 'Gupta', 
  'Gandhi', 'Desai', 'Mehta', 'Malhotra', 'Verma',
  'Joshi', 'Reddy', 'Naidu', 'Iyer', 'Krishnamurthy',
  'Chowdhury', 'Rajput', 'Bose', 'Nair', 'Hegde'
]

// Function to generate a random email
function generateEmail(name: string): string {
  const cleanedName = name.toLowerCase().replace(/\s+/g, '.')
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
  const randomDomain = domains[Math.floor(Math.random() * domains.length)]
  return `${cleanedName}.${Math.floor(Math.random() * 1000)}@${randomDomain}`
}

// Function to generate unique users
async function createUsers(): Promise<User[]> {
  const users: User[] = []
  const usedEmails = new Set<string>()
  const usedNames = new Set<string>()

  for (let i = 0; i < 25; i++) {
    let firstName: string, 
        lastName: string, 
        name: string, 
        email: string, 
        gender: keyof IndianNames

    // Alternate between male and female
    gender = i % 2 === 0 ? 'male' : 'female'
    
    // Ensure unique names
    do {
      firstName = indianFirstNames[gender][Math.floor(Math.random() * indianFirstNames[gender].length)]
      lastName = indianLastNames[Math.floor(Math.random() * indianLastNames.length)]
      name = `${firstName} ${lastName}`
    } while (usedNames.has(name))

    // Ensure unique email
    do {
      email = generateEmail(name)
    } while (usedEmails.has(email))

    // Hash password using Bun
    const hashedPassword = await Bun.password.hash('Password123!')

    // Generate profile image URL (placeholder)
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`

    const user: User = {
      id: randomUUID(),
      name: name,
      email: email,
      password: hashedPassword,
      role: 'user',
      friendIds: [],
      requestSent: [],
      requestReceived: [],
      image: profileImage,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: null
    }

    users.push(user)
    usedEmails.add(email)
    usedNames.add(name)
  }

  return users
}

// Main function to create users
async function main(): Promise<void> {
  try {
    // Generate users
    const users = await createUsers()
    
    // Batch create users
    const createdUsers = await prisma.user.createMany({
      data: users,
      skipDuplicates: true
    })

    console.log(`Successfully created ${createdUsers.count} users`)
  } catch (error) {
    console.error('Error creating users:', error)
    
    // More detailed error handling
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      })
    }
  } finally {
    // Ensure Prisma connection is closed
    await prisma.$disconnect()
  }
}

// Execute the script
main().catch((e) => {
  console.error('Unhandled error:', e)
  process.exit(1)
})