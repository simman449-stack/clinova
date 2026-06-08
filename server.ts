import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  User, 
  ClinicalCase, 
  Contribution, 
  Vote, 
  Notification, 
  UserRole,
  CaseDifficulty,
  CaseStatus,
  ContributionCategory
} from "./src/types";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

app.use(express.json());

// Main Database structure in memory
interface DbSchema {
  users: Record<string, User & { passwordHash: string }>;
  cases: Record<string, ClinicalCase>;
  contributions: Record<string, Contribution>;
  votes: Record<string, Vote>;
  notifications: Record<string, Notification>;
}

let db: DbSchema = {
  users: {},
  cases: {},
  contributions: {},
  votes: {},
  notifications: {}
};

// Seeding standard assets if DB doesn't exist
function seedDatabase() {
  const seededUsers: Record<string, User & { passwordHash: string }> = {
    "user_mod": {
      id: "user_mod",
      full_name: "Dr. Evelyn Foster",
      email: "moderator@clinova.edu",
      university: "Johns Hopkins School of Medicine",
      academic_year: "Clinical Fellow",
      country: "United States",
      biography: "Fellow in Cardiovascular Medicine. Passionate about medical education and simulation-based training. Reviewing clinical cases on Clinova.",
      reputation_score: 1250,
      role: "moderator",
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      badges: ["Founding Educator", "Top Reviewer", "Clinical Mentor"],
      passwordHash: "password123"
    },
    "user_student_1": {
      id: "user_student_1",
      full_name: "Liam Carter",
      email: "student@clinova.edu",
      university: "King's College London",
      academic_year: "Year 4",
      country: "United Kingdom",
      biography: "Final year medical student interested in neurology and critical care. Constantly practicing diagnostic pathways.",
      reputation_score: 125,
      role: "student",
      created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      badges: ["Active Contributor", "Biomed Starter"],
      passwordHash: "password123"
    },
    "user_student_2": {
      id: "user_student_2",
      full_name: "Sarah Chen",
      email: "sarah@clinova.edu",
      university: "University of Toronto",
      academic_year: "Year 3",
      country: "Canada",
      biography: "Third-year medical student. Enthusiastic about pediatrics and global health initiatives.",
      reputation_score: 45,
      role: "student",
      created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      badges: ["Rising Star"],
      passwordHash: "password123"
    }
  };

  const seededCases: Record<string, ClinicalCase> = {
    "case_1": {
      id: "case_1",
      author_id: "user_student_1",
      author_name: "Liam Carter",
      author_reputation: 125,
      title: "Acute Substernal Chest Pain radiating to Left Arm",
      specialty: "Cardiology",
      difficulty: "Medium",
      age: 54,
      sex: "Male",
      chief_complaint: "Crushing, retrosternal chest discomfort radiating to left arm and neck starting 2 hours ago during light lawn mowing.",
      history_present_illness: "The patient describes a sudden pressure-like chest pain, rated 8/10, accompanied by sweating and moderate nausea. He resting did not relieve the pain. Underwent similar mild incidents of exertion-induced chest tightness over the past month, which always disappeared with rest.",
      past_medical_history: "Essential hypertension (diagnosed 5 years ago), Hyperlipidemia (diet-controlled), Type 2 Diabetes Mellitus on Metformin.",
      medications: "Metformin 500mg BID, Lisinopril 10mg QD, Aspirin 81mg QD.",
      vital_signs: "BP: 158/94 mmHg, HR: 98 bpm (regular), Temp: 36.9°C (98.4°F), RR: 20 bpm, SpO2: 95% on room air.",
      physical_exam: "General: Patient appears highly anxious, cold, and diaphoretic (sweaty).\nCardiovascular: Distinct S4 gallop heard at apex, no murmurs or friction rubs. Jugular venous pressure (JVP) is normal at 6 cm.\nRespiratory: Chest auscultation reveals clear breath sounds bilaterally without crackles or wheezes.\nAbdomen: Sof, non-tender, no organomegaly.\nExtremities: Normal radial pulses, no peripheral edema. Capillary refill is 2 seconds.",
      laboratory_results: "Troponin I: Elevated at 1.45 ng/mL (Reference range: <0.04 ng/mL).\nSerum Creatinine: 1.0 mg/dL.\nElectrolytes: Na+ 139 mEq/L, K+ 4.1 mEq/L.\nCBC: WBC 9.5 x10^3/uL, Hemoglobin 14.2 g/dL.",
      imaging_results: "ECG: Shows 2.5 mm hyperacute ST-segment elevation in leads V2 through V5, with reciprocal 1 mm ST-segment depression in leads II, III, and aVF.\nChest X-ray: Heart size normal; lungs clear without evidence of congestion, pleural effusion, or widened mediastinum.",
      discussion_question: "What is your immediate primary differential diagnosis and first-line emergency management plan?",
      status: "open",
      created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      contributions_count: 2,
      votes_count: 5
    },
    "case_2": {
      id: "case_2",
      author_id: "user_student_2",
      author_name: "Sarah Chen",
      author_reputation: 45,
      title: "Sudden-Onset Severe Headache (Thunderclap style)",
      specialty: "Neurology",
      difficulty: "Hard",
      age: 28,
      sex: "Female",
      chief_complaint: "Sudden, excruciating, explosive headache starting 1 hour ago during physical strain, described as the 'worst headache of my life'.",
      history_present_illness: "Headache peak-intensity was reached within 30 seconds. Accompanied by photophobia (sensitivity to light), phonophobia, and one episode of non-projectile vomiting. She denies any preceding trauma, fever, or history of similar migraines.",
      past_medical_history: "Mild episodic migraines, controlled with occasional Ibuprofen. Receptive to oral contraceptive pills (OCP) for 2 years.",
      medications: "Combination Oral Contraceptive Pill (Ethinylestradiol/Levonorgestrel) daily.",
      vital_signs: "BP: 144/88 mmHg, HR: 84 bpm, Temp: 37.1°C (98.8°F), RR: 16 bpm, SpO2: 99% on room air.",
      physical_exam: "General: Patient is lying in a darkened room, distressed, grimacing in pain.\nNeurological: GCS 15. Pupils are equal, round, 3mm, and reactive to light. No cranial nerve deficits (II-XII fully intact). Motor strength and sensation are normal (5/5) in all four limbs. Reflexes 2+ symmetrical.\nMeningeal signs: Positive Kernig's sign, mild neck rigidity on passive flexion.",
      laboratory_results: "CBC, Coagulation panel (PT/INR, aPTT), and basic biochemistry are all within normal limits.",
      imaging_results: "Non-contrast Head CT: Shows hyperdense signal pooling within the basal cisterns, sylvian fissures, and anterior interhemispheric fissure.",
      discussion_question: "Which specific vascular lesion is the most common cause of this presentation, and what are the immediate clinical diagnostic/management priorities?",
      status: "open",
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      contributions_count: 1,
      votes_count: 2
    },
    "case_3": {
      id: "case_3",
      author_id: "user_mod",
      author_name: "Dr. Evelyn Foster",
      author_reputation: 1250,
      title: "Progressive Pathological Fatigue and Scleral Icterus",
      specialty: "Internal Medicine",
      difficulty: "Easy",
      age: 45,
      sex: "Female",
      chief_complaint: "Gradual development of deep fatigue, general malaise, skin itching, and yellowing of the eyes over the past month.",
      history_present_illness: "The patient notes that her fatigue has severely impacted her daily activities. Over the last 2 weeks, she noticed her eyes turning yellow, accompanied by dark urine and lighter-colored stools. Denies abdominal pain, fever, chills, alcohol abuse, or recent travel.",
      past_medical_history: "Hashimoto's Thyroiditis (diagnosed 8 years ago, stable on Levothyroxine).",
      medications: "Levothyroxine 88mcg daily, Multivitamins.",
      vital_signs: "BP: 118/76 mmHg, HR: 68 bpm, Temp: 36.6°C (97.9°F), RR: 14 bpm, SpO2: 98%.",
      physical_exam: "General: Appears fatigued but not in acute distress. Visible yellow discoloration of the sclerae (scleral icterus) and under the tongue.\nAbdomen: Soft, non-distended. Mildly tender, palpable liver edge about 2 cm below the costal margin. No splenomegaly. No ascites.\nSkin: Mild excoriations (scratch marks) on forearms, no spider angiomas or palmar erythema.",
      laboratory_results: "Total Bilirubin: 4.8 mg/dL (Conjugated: 3.6 mg/dL).\nAST: 210 U/L (elevated), ALT: 235 U/L (elevated).\nAlkaline Phosphatase (ALP): 315 U/L (severely elevated).\nGGT: 280 U/L.\nTSH: 2.1 uIU/mL (normal on medication).",
      imaging_results: "Abdominal Ultrasound: Normal caliper liver, smooth liver contours. Biliary tree is fully patent without intra- or extrahepatic ductal dilation. Gallbladder contains no stones, normal wall thickness.",
      discussion_question: "Considering her autoimmune background, what Autoantibodies and specialized serology would you prioritize to confirm the diagnosis?",
      status: "solved",
      created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      contributions_count: 1,
      votes_count: 8
    }
  };

  const seededContributions: Record<string, Contribution> = {
    "contrib_1": {
      id: "contrib_1",
      case_id: "case_1",
      user_id: "user_mod",
      user_name: "Dr. Evelyn Foster",
      user_reputation: 1250,
      user_role: "moderator",
      category: "differential_diagnosis",
      content: "The primary diagnosis matches an Acute Anterior Myocardial Infarction (STEMI), given the 2.5mm ST-elevation in V2-V5. Key differentials include acute coronary syndrome, aortic dissection (would present with tearing pain radiating to the back, and wide mediastinum on CXR, but ECG findings here strongly point to occlusion), acute pericarditis (which would be diffuse ST-elevation and PR depression, relieved by sitting forward), and pulmonary embolism.",
      votes: 3,
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      is_helpful: true,
      moderator_recognized: true
    },
    "contrib_2": {
      id: "contrib_2",
      case_id: "case_1",
      user_id: "user_student_2",
      user_name: "Sarah Chen",
      user_reputation: 45,
      user_role: "student",
      category: "management_plan",
      content: "Immediate management must center on standard emergency cardiac protocol. Put the patient on high-flow Oxygen only if SpO2 < 90% (he is at 95%, so monitor), administer Aspirin 324mg (chewable to speed absorption), sublingual Nitroglycerin (if blood pressure holds), and activate the cardiac catheterization lab immediately for primary Percutaneous Coronary Intervention (PCI) target timing < 90 mins.",
      votes: 2,
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      is_helpful: false
    },
    "contrib_3": {
      id: "contrib_3",
      case_id: "case_2",
      user_id: "user_mod",
      user_name: "Dr. Evelyn Foster",
      user_reputation: 1250,
      user_role: "moderator",
      category: "differential_diagnosis",
      content: "The CT head showing hyperdensity in the basal cisterns is pathognomonic for a Subarachnoid Hemorrhage (SAH). The most common structural cause of non-traumatic SAH is a ruptured saccular (berry) aneurysm, particularly located near the Anterior Communicating Artery (ACom) in the Circle of Willis. Immediate priorities must include keeping systolic BP lower than 140 mmHg (with IV Labetalol or Nicardipine) to limit rebleeding risks, starting Oral Nimodipine 60mg every 4 hours to prevent vasospasm, and consulting neurosurgery for urgent endovascular coiling or microsurgical clipping.",
      votes: 2,
      created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      is_helpful: true
    },
    "contrib_4": {
      id: "contrib_4",
      case_id: "case_3",
      user_id: "user_student_1",
      user_name: "Liam Carter",
      user_reputation: 125,
      user_role: "student",
      category: "investigations",
      content: "We must rule out autoimmune liver conditions. I would order Anti-Mitochondrial Antibodies (AMA), which are positive in >95% of patients with Primary Biliary Cholangitis (PBC), and compatible with the isolated elevated ALP. Anti-Nuclear Antibody (ANA) and Anti-Smooth Muscle Antibody (ASMA) are useful to test for Autoimmune Hepatitis overlap.",
      votes: 4,
      created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
      is_helpful: true,
      moderator_recognized: true
    }
  };

  const seededVotes: Record<string, Vote> = {
    "vote_1": { id: "vote_1", contribution_id: "contrib_1", user_id: "user_student_1", vote_type: "up" },
    "vote_2": { id: "vote_2", contribution_id: "contrib_1", user_id: "user_student_2", vote_type: "up" },
    "vote_3": { id: "vote_3", contribution_id: "contrib_2", user_id: "user_student_1", vote_type: "up" },
    "vote_4": { id: "vote_4", contribution_id: "contrib_3", user_id: "user_student_1", vote_type: "up" },
    "vote_5": { id: "vote_5", contribution_id: "contrib_4", user_id: "user_student_2", vote_type: "up" }
  };

  const seededNotifications: Record<string, Notification> = {
    "notif_1": {
      id: "notif_1",
      user_id: "user_student_1",
      message: "Dr. Evelyn Foster commented on your Case: 'Acute Substernal Chest Pain...'",
      is_read: false,
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      link: "/cases/case_1"
    },
    "notif_2": {
      id: "notif_2",
      user_id: "user_student_1",
      message: "Your contribution in Case 3 was approved for 'Moderator Recognition' (+10 Reputation!)",
      is_read: false,
      created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      link: "/cases/case_3"
    }
  };

  db = {
    users: seededUsers,
    cases: seededCases,
    contributions: seededContributions,
    votes: seededVotes,
    notifications: seededNotifications
  };

  saveDb();
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const contents = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(contents);
    } else {
      seedDatabase();
    }
  } catch (e) {
    console.error("Error loading database file. Initializing and seeding a new one.", e);
    seedDatabase();
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save database file.", e);
  }
}

// Ensure database is loaded
loadDb();

// Reputation helper & Badges helper
function updateReputation(userId: string, points: number) {
  const user = db.users[userId];
  if (!user) return;
  user.reputation_score = Math.max(0, user.reputation_score + points);
  
  // Recalculate Badges based on score
  const badgesSet = new Set<string>(user.badges || []);
  
  // Threshold badges
  if (user.reputation_score >= 1000 && !badgesSet.has("Clinical Mentor")) {
    badgesSet.add("Clinical Mentor");
  }
  if (user.reputation_score >= 500 && !badgesSet.has("Advanced Contributor")) {
    badgesSet.add("Advanced Contributor");
  }
  if (user.reputation_score >= 100 && !badgesSet.has("Active Contributor")) {
    badgesSet.add("Active Contributor");
  }
  if (user.reputation_score >= 10 && !badgesSet.has("Helpful Clinical Peer")) {
    badgesSet.add("Helpful Clinical Peer");
  }

  user.badges = Array.from(badgesSet);
  saveDb();
}

// Retrieve Reputation Level text
export function getReputationLevel(score: number): string {
  if (score >= 1000) return "Clinical Mentor";
  if (score >= 501) return "Advanced Contributor";
  if (score >= 101) return "Contributor";
  return "Beginner";
}

// API endpoint for Authentication
app.post("/api/auth/register", (req, res) => {
  const { full_name, email, university, academic_year, country, password, biography } = req.body;
  if (!full_name || !email || !university || !academic_year || !country || !password) {
    return res.status(400).json({ error: "Missing required profile fields" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = Object.values(db.users).find(u => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ error: "Email address is already registered." });
  }

  const userId = "user_" + Math.random().toString(36).substring(2, 11);
  const newUser: User & { passwordHash: string } = {
    id: userId,
    full_name,
    email: normalizedEmail,
    university,
    academic_year,
    country,
    biography: biography || "",
    reputation_score: 0,
    role: "student",
    created_at: new Date().toISOString(),
    badges: ["Clinova Starter"],
    passwordHash: password // local plain check
  };

  db.users[userId] = newUser;
  saveDb();

  const { passwordHash, ...userPayload } = newUser;
  res.json({ token: userId, user: userPayload });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = Object.values(db.users).find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user || user.passwordHash !== password) {
    return res.status(400).json({ error: "Invalid email or password." });
  }

  const { passwordHash, ...userPayload } = user;
  res.json({ token: user.id, user: userPayload });
});

app.get("/api/auth/me", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !db.users[token]) {
    // If no token is provided, return a Guest user profile representation
    return res.json({ 
      guest: true, 
      user: {
        id: "guest",
        full_name: "Guest Student",
        email: "guest@clinova.edu",
        university: "Browse-only Access",
        academic_year: "N/A",
        country: "Global",
        biography: "Viewing educational medical files as guest.",
        reputation_score: 0,
        role: "guest",
        created_at: new Date().toISOString(),
        badges: []
      }
    });
  }

  const { passwordHash, ...userPayload } = db.users[token];
  res.json({ user: userPayload });
});

// Search and Filter Clinical Cases
app.get("/api/cases", (req, res) => {
  const { specialty, difficulty, sortBy, search } = req.query;
  let casesList = Object.values(db.cases);

  // Filter by specialty
  if (specialty && specialty !== "All") {
    casesList = casesList.filter(c => c.specialty.toLowerCase() === (specialty as string).toLowerCase());
  }

  // Filter by difficulty
  if (difficulty && difficulty !== "All") {
    casesList = casesList.filter(c => c.difficulty.toLowerCase() === (difficulty as string).toLowerCase());
  }

  // Search filter
  if (search && (search as string).trim()) {
    const q = (search as string).toLowerCase().trim();
    casesList = casesList.filter(c => 
      c.title.toLowerCase().includes(q) ||
      c.chief_complaint.toLowerCase().includes(q) ||
      c.specialty.toLowerCase().includes(q) ||
      c.author_name.toLowerCase().includes(q)
    );
  }

  // Sort logic
  if (sortBy === "discussed") {
    casesList.sort((a, b) => b.contributions_count - a.contributions_count);
  } else if (sortBy === "popular") {
    casesList.sort((a, b) => b.votes_count - a.votes_count);
  } else {
    // default recent
    casesList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  res.json(casesList);
});

// Get detailed Clinical Case & its nested contributions
app.get("/api/cases/:id", (req, res) => {
  const caseId = req.params.id;
  const clinicalCase = db.cases[caseId];
  if (!clinicalCase) {
    return res.status(404).json({ error: "Clinical case file not found." });
  }

  // Fetch contributions for this case
  const contributionsList = Object.values(db.contributions)
    .filter(c => c.case_id === caseId)
    .sort((a, b) => b.votes - a.votes || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    case: clinicalCase,
    contributions: contributionsList
  });
});

// Create new Clinical Case File
app.post("/api/cases", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const author = token ? db.users[token] : null;

  if (!author || author.role === "guest") {
    return res.status(403).json({ error: "You must be signed in as a student to create cases." });
  }

  const {
    title,
    specialty,
    difficulty,
    age,
    sex,
    chief_complaint,
    history_present_illness,
    past_medical_history,
    medications,
    vital_signs,
    physical_exam,
    laboratory_results,
    imaging_results,
    discussion_question
  } = req.body;

  if (!title || !specialty || !difficulty || !age || !sex || !chief_complaint || !discussion_question) {
    return res.status(400).json({ error: "Missing required core case fields." });
  }

  const caseId = "case_" + Math.random().toString(36).substring(2, 11);
  const newCase: ClinicalCase = {
    id: caseId,
    author_id: author.id,
    author_name: author.full_name,
    author_reputation: author.reputation_score,
    title,
    specialty,
    difficulty: difficulty as CaseDifficulty,
    age: Number(age),
    sex,
    chief_complaint,
    history_present_illness: history_present_illness || "",
    past_medical_history: past_medical_history || "",
    medications: medications || "",
    vital_signs: vital_signs || "",
    physical_exam: physical_exam || "",
    laboratory_results: laboratory_results || "",
    imaging_results: imaging_results || "",
    discussion_question,
    status: "open",
    created_at: new Date().toISOString(),
    contributions_count: 0,
    votes_count: 0
  };

  db.cases[caseId] = newCase;
  saveDb();

  // Award Reputation (+5 for creating a case!)
  updateReputation(author.id, 5);

  res.json(newCase);
});

// Update Case Status (open, solved, archived)
app.post("/api/cases/:id/status", (req, res) => {
  const caseId = req.params.id;
  const { status } = req.body;
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? db.users[token] : null;

  if (!user) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  const targetCase = db.cases[caseId];
  if (!targetCase) {
    return res.status(404).json({ error: "Case not found." });
  }

  // Author or Moderator can change status
  if (targetCase.author_id !== user.id && user.role !== "moderator" && user.role !== "admin") {
    return res.status(403).json({ error: "Only the case author or moderators can update case status." });
  }

  targetCase.status = status as CaseStatus;
  saveDb();

  // Create notifications for all contributors of this case
  const contributors = new Set(
    Object.values(db.contributions)
      .filter(c => c.case_id === caseId)
      .map(c => c.user_id)
  );

  contributors.forEach(contribUserId => {
    if (contribUserId !== user.id) {
      const notifId = "notif_" + Math.random().toString(36).substring(2, 11);
      db.notifications[notifId] = {
        id: notifId,
        user_id: contribUserId,
        message: `Case status for '${targetCase.title}' was updated to ${status} by ${user.full_name}.`,
        is_read: false,
        created_at: new Date().toISOString(),
        link: `/cases/${caseId}`
      };
    }
  });

  saveDb();
  res.json(targetCase);
});

// Delete Case file (Moderators or Admin only)
app.delete("/api/cases/:id", (req, res) => {
  const caseId = req.params.id;
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? db.users[token] : null;

  if (!user || (user.role !== "moderator" && user.role !== "admin")) {
    return res.status(430).json({ error: "Access denied. Only moderators can remove cases." });
  }

  const targetCase = db.cases[caseId];
  if (!targetCase) {
    return res.status(404).json({ error: "Case not found." });
  }

  // Remove contributions of this case too
  Object.keys(db.contributions).forEach(cid => {
    if (db.contributions[cid].case_id === caseId) {
      delete db.contributions[cid];
    }
  });

  delete db.cases[caseId];
  saveDb();

  res.json({ success: true, message: "Case folder deleted successfully." });
});

// Submit a new categorized contribution to a clinical case
app.post("/api/cases/:id/contributions", (req, res) => {
  const caseId = req.params.id;
  const { category, content } = req.body;
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? db.users[token] : null;

  if (!user || user.role === "guest") {
    return res.status(403).json({ error: "Please log in to submit a contribution." });
  }

  const targetCase = db.cases[caseId];
  if (!targetCase) {
    return res.status(404).json({ error: "Case not found." });
  }

  if (!category || !content) {
    return res.status(400).json({ error: "Category and discussion content is required." });
  }

  const contribId = "contrib_" + Math.random().toString(36).substring(2, 11);
  const newContrib: Contribution = {
    id: contribId,
    case_id: caseId,
    user_id: user.id,
    user_name: user.full_name,
    user_reputation: user.reputation_score,
    user_role: user.role,
    category: category as ContributionCategory,
    content,
    votes: 0,
    created_at: new Date().toISOString()
  };

  db.contributions[contribId] = newContrib;
  
  // Increment case contribution counter
  targetCase.contributions_count += 1;
  saveDb();

  // Notify case author
  if (targetCase.author_id !== user.id) {
    const notifId = "notif_" + Math.random().toString(36).substring(2, 11);
    db.notifications[notifId] = {
      id: notifId,
      user_id: targetCase.author_id,
      message: `${user.full_name} commented on your Case: '${targetCase.title}' under ${category.replace("_", " ")}`,
      is_read: false,
      created_at: new Date().toISOString(),
      link: `/cases/${caseId}`
    };
    saveDb();
  }

  res.json(newContrib);
});

// Delete contribution (Mod, Admin, or Author only)
app.delete("/api/contributions/:id", (req, res) => {
  const contribId = req.params.id;
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? db.users[token] : null;

  if (!user) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const contrib = db.contributions[contribId];
  if (!contrib) {
    return res.status(404).json({ error: "Contribution not found." });
  }

  if (contrib.user_id !== user.id && user.role !== "moderator" && user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Only the author or a moderator can delete comments." });
  }

  const targetCase = db.cases[contrib.case_id];
  if (targetCase) {
    targetCase.contributions_count = Math.max(0, targetCase.contributions_count - 1);
  }

  delete db.contributions[contribId];
  saveDb();

  res.json({ success: true, message: "Comment deleted." });
});

// Upvote or Downvote a contribution
app.post("/api/contributions/:id/vote", (req, res) => {
  const contribId = req.params.id;
  const { vote_type } = req.body; // 'up' or 'down'
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? db.users[token] : null;

  if (!user || user.role === "guest") {
    return res.status(403).json({ error: "Please log in to vote on peer reasoning." });
  }

  const contrib = db.contributions[contribId];
  if (!contrib) {
    return res.status(404).json({ error: "Contribution file not found." });
  }

  if (contrib.user_id === user.id) {
    return res.status(400).json({ error: "You cannot vote on your own clinical contributions." });
  }

  // Look for existing vote
  const electionId = `vote_${contribId}_${user.id}`;
  const existingVote = db.votes[electionId];
  let repDiff = 0;
  let voteDiff = 0;

  if (existingVote) {
    if (existingVote.vote_type === vote_type) {
      // Undo vote
      voteDiff = vote_type === "up" ? -1 : 1;
      repDiff = vote_type === "up" ? -2 : 2; // upvote receiver gets -2
      delete db.votes[electionId];
    } else {
      // Toggle vote
      voteDiff = vote_type === "up" ? 2 : -2;
      repDiff = vote_type === "up" ? 4 : -4; // from -2 to +2 or vice versa
      existingVote.vote_type = vote_type;
    }
  } else {
    // New vote
    db.votes[electionId] = {
      id: electionId,
      contribution_id: contribId,
      user_id: user.id,
      vote_type
    };
    voteDiff = vote_type === "up" ? 1 : -1;
    repDiff = vote_type === "up" ? 2 : -2; // upvote adds 2, downvote subtracts 2
  }

  contrib.votes += voteDiff;
  saveDb();

  // update case total votes count
  const parentCase = db.cases[contrib.case_id];
  if (parentCase) {
    parentCase.votes_count = Math.max(0, parentCase.votes_count + voteDiff);
    saveDb();
  }

  // update reputation of contribution author
  updateReputation(contrib.user_id, repDiff);

  // Notify contribution author on high positive reactions
  if (vote_type === "up" && repDiff > 0) {
    const notifId = "notif_" + Math.random().toString(36).substring(2, 11);
    db.notifications[notifId] = {
      id: notifId,
      user_id: contrib.user_id,
      message: `${user.full_name} upvoted your clinical reasoning post in Case '${parentCase?.title || "Discussion"}'.`,
      is_read: false,
      created_at: new Date().toISOString(),
      link: `/cases/${contrib.case_id}`
    };
    saveDb();
  }

  // Return final details
  res.json({ 
    success: true, 
    votes: contrib.votes,
    userVote: db.votes[electionId]?.vote_type || null
  });
});

// Set contribution as Most Helpful
app.post("/api/contributions/:id/helpful", (req, res) => {
  const contribId = req.params.id;
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? db.users[token] : null;

  if (!user) {
    return res.status(403).json({ error: "Access denied." });
  }

  const contrib = db.contributions[contribId];
  if (!contrib) {
    return res.status(404).json({ error: "Contribution not found." });
  }

  const parentCase = db.cases[contrib.case_id];
  if (!parentCase) {
    return res.status(404).json({ error: "Parent clinical case file not found." });
  }

  if (parentCase.author_id !== user.id) {
    return res.status(403).json({ error: "Only the case author is authorized to select the Most Helpful Contribution." });
  }

  // Toggle or select
  const previouslyHelpful = contrib.is_helpful;
  
  // Unset any other helpful contribution on this case first
  Object.values(db.contributions).forEach(c => {
    if (c.case_id === parentCase.id && c.is_helpful) {
      c.is_helpful = false;
      // Deduct reputation
      updateReputation(c.user_id, -20);
    }
  });

  if (!previouslyHelpful) {
    contrib.is_helpful = true;
    updateReputation(contrib.user_id, 20); // +20 points for Helpful mark!
    
    // Notify contribution author
    const notifId = "notif_" + Math.random().toString(36).substring(2, 11);
    db.notifications[notifId] = {
      id: notifId,
      user_id: contrib.user_id,
      message: `Congratulations! ${user.full_name} selected your clinical reasoning as the 'Most Helpful Contribution' (+20 Rep!)`,
      is_read: false,
      created_at: new Date().toISOString(),
      link: `/cases/${contrib.case_id}`
    };
    saveDb();
  }

  saveDb();
  res.json({ success: true, contribution: contrib });
});

// Moderator Recognition stamp helper (+10 reputation)
app.post("/api/contributions/:id/recognize", (req, res) => {
  const contribId = req.params.id;
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? db.users[token] : null;

  if (!user || (user.role !== "moderator" && user.role !== "admin")) {
    return res.status(403).json({ error: "Access Denied. Only moderators can award quality badges." });
  }

  const contrib = db.contributions[contribId];
  if (!contrib) {
    return res.status(404).json({ error: "Contribution not found." });
  }

  const isAlreadyRecognized = contrib.moderator_recognized;
  contrib.moderator_recognized = !isAlreadyRecognized;
  saveDb();

  // Award or deduct 10 points
  const repChange = !isAlreadyRecognized ? 10 : -10;
  updateReputation(contrib.user_id, repChange);

  // Notify author if awarded
  if (!isAlreadyRecognized) {
    const parentCase = db.cases[contrib.case_id];
    const notifId = "notif_" + Math.random().toString(36).substring(2, 11);
    db.notifications[notifId] = {
      id: notifId,
      user_id: contrib.user_id,
      message: `Your comment in Case '${parentCase?.title || "Clinical Study"}' was awarded 'Moderator Recognition' for exceptional clinical reasoning! (+10 Rep)`,
      is_read: false,
      created_at: new Date().toISOString(),
      link: `/cases/${contrib.case_id}`
    };
    saveDb();
  }

  res.json({ success: true, contribution: contrib });
});

// Load user notifications list
app.get("/api/notifications", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? db.users[token] : null;

  if (!user) {
    return res.json([]);
  }

  const notificationsList = Object.values(db.notifications)
    .filter(n => n.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json(notificationsList);
});

// Read all notifications
app.post("/api/notifications/read-all", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? db.users[token] : null;

  if (!user) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  Object.values(db.notifications).forEach(n => {
    if (n.user_id === user.id) {
      n.is_read = true;
    }
  });

  saveDb();
  res.json({ success: true });
});

// AI Synthesis of a clinical case using gemini-3.5-flash
app.post("/api/cases/:id/ai-synthesis", async (req, res) => {
  const caseId = req.params.id;
  const targetCase = db.cases[caseId];

  if (!targetCase) {
    return res.status(404).json({ error: "Clinical case not found." });
  }

  // Define fallback details for default seeded cases
  const getPrecachedSynthesis = (id: string, kase: ClinicalCase) => {
    if (id === "case_1") {
      return {
        summary: "The patient is a 54-year-old male with multiple severe cardiovascular risk factors (essential hypertension, hyperlipidemia, type 2 diabetes mellitus) presenting with acute crushing retrosternal pain radiating to the left arm, cold diaphoresis, nausea, and an S4 gallop. The electrocardiogram (ECG) showing hyperacute ST-segment elevations in leads V2-V5 with reciprocal depressions, coupled with elevated Troponin I (1.45 ng/mL), confirms a diagnosis of acute anterolateral ST-elevation myocardial infarction (STEMI).",
        differentialDiagnoses: [
          { diagnosis: "Acute Anterior STEMI (LAD Occlusion)", probability: "Primary / Confirmed", rationale: "Supported by clinical presentation (crushing exertional pain, anxiety, sweating), hyperacute ST-segment elevation in precordial leads (V2-V5), reciprocal depressions in inferior leads, and significantly elevated Troponin I." },
          { diagnosis: "Acute Pericarditis / Myopericarditis", probability: "Less likely", rationale: "May present with chest pain and elevated Troponin, but typically exhibits diffuse ST elevations across most leads with PR-segment depression, and pain is sharp and pleuritic (relieved by sitting forward)." },
          { diagnosis: "Acute Aortic Dissection", probability: "Secondary / Exclude", rationale: "Must be ruled out due to tearing pain profile radiating to the back and hyperacute hypertension, but ECG elevations in V2-V5 are rare unless dissection propagation compromises the left main coronary artery." }
        ],
        clinicalPearls: [
          "In patients presenting with symptoms suggestive of myocardial ischemia, an ECG must be acquired and interpreted within 10 minutes of arrival.",
          "An S4 gallop is common in acute myocardial infarction due to sudden change in ventricular compliance during diastolic filling.",
          "Therapeutic timeline is critical: the target threshold for balloon inflation during primary Percutaneous Coronary Intervention (PCI) is less than 90 minutes from first medical contact ('Door-to-Balloon' time)."
        ],
        recommendedWorkup: [
          "Urgent diagnostic Coronary Angiography to locate the site of arterial obstruction.",
          "Serial Troponin I testing every 3–6 hours to monitor infarct kinetics.",
          "Echocardiogram (TTE) post-stabilization to assess Left Ventricular Ejection Fraction (LVEF) and check for regional wall motion abnormalities."
        ],
        emergencyActions: [
          "Administer chewable Aspirin (324 mg) immediately to speed blood-thinning absorption.",
          "Administer high-dose statin therapy (e.g., Atorvastatin 80 mg) and start anticoagulation (Heperanization).",
          "Activate the cardiac catheterization laboratory immediately for primary PCI."
        ]
      };
    } else if (id === "case_2") {
      return {
        summary: "A 28-year-old female presents with a sudden-onset, explosive 'thunderclap' headache peaked within 30 seconds during physical strain, associated with light sensitivity, neck stiffness, positive Kernig's sign, and vomiting. Non-contrast head CT demonstrating hyperdense signal pooling in the basal cisterns and anterior interhemispheric fissures confirms a diagnosis of acute non-traumatic Subarachnoid Hemorrhage (SAH), highly associated with a ruptured saccular aneurysm.",
        differentialDiagnoses: [
          { diagnosis: "Ruptured Saccular (Berry) Aneurysm Subarachnoid Hemorrhage", probability: "Primary / Confirmed", rationale: "Classic presentation of thunderclap headache reaching maximum severity in seconds, coupled with positive clinical meningeal signs and diagnostic blood pooling in the basal cisterns on CT scans." },
          { diagnosis: "Cerebral Venous Sinus Thrombosis (CVST)", probability: "Secondary / Important", rationale: "Can present with thunderclap headache and intracranial hypertension, particularly in young female patients on combined oral contraceptives, but rarely displays isolated cistern blood pooling." },
          { diagnosis: "Reversible Cerebral Vasoconstriction Syndrome (RCVS)", probability: "Less likely", rationale: "Characterized by recurrent thunderclap headaches triggered by exertion, but head CT is typically normal or shows minimal focal convexity subarachnoid hemorrhage without cistern involvement." }
        ],
        clinicalPearls: [
          "A non-contrast head CT has a sensitivity of approximately 98% for SAH if performed within the first 6–24 hours of headache onset; a negative CT does not fully rule it out, and lumbar puncture is indicated if clinical suspicion remains high.",
          "Meningeal signs (neck rigidity, Kernig's, Brudzinski's) can take up to 4–6 hours to develop as the blood irritates the leptomeninges.",
          "Rebleeding is the most devastating early complication of aneurysmal SAH, with the highest risk occurring within the first 24 hours."
        ],
        recommendedWorkup: [
          "Urgent CT Angiography (CTA) or Digital Subtraction Angiography (DSA) of the cerebral vessels to identify the location of the aneurysm.",
          "Continuous arterial line blood pressure monitoring to maintain strict parameters.",
          "Serum sodium monitoring daily to screen for Cerebral Salt Wasting (CSW) or SIADH."
        ],
        emergencyActions: [
          "Strict blood pressure control (maintain Systolic BP < 140 mmHg) using IV Nicardipine or Labetol infusions.",
          "Commence oral Nimodipine (60 mg every 4 hours) immediately to reduce vasospasm risks.",
          "Consult neurosurgery / interventional neurorology immediately for aneurysm securement via endovascular coiling or surgical clipping."
        ]
      };
    } else if (id === "case_3") {
      return {
        summary: "A 45-year-old female with a history of Hashimoto's Thyroiditis presents with progressive fatigue, scleral icterus, pruritus, dark urine, pale stools, and hepatomegaly, showing a cholestatic pattern of liver injury (moderately elevated transaminases AST 210 / ALT 235, high Alkaline Phosphatase 315, total bilirubin 4.8 mg/dL). Her autoimmune background, coupled with a normal abdominal ultrasound and cholestatic features, strongly suggests Primary Biliary Cholangitis (PBC) or an autoimmune hepatitis overlap syndrome.",
        differentialDiagnoses: [
          { diagnosis: "Primary Biliary Cholangitis (PBC)", probability: "Primary / Confirmed", rationale: "High Alkaline Phosphatase and GGT, marked pruritus, jaundice, normal biliary ducts on ultrasound, and a personal history of autoimmune thyroiditis (Hashimoto's)." },
          { diagnosis: "Autoimmune Hepatitis (AIH)", probability: "Secondary / Overlap", rationale: "Elevated transaminases (AST/ALT) and thyroiditis, though typically presents with a hepatocellular injury pattern rather than isolated severe ALP elevation, unless an AIH-PBC overlap syndrome is present." },
          { diagnosis: "Choledocholithiasis / Extrahepatic Obstructive Jaundice", probability: "Less likely / Ruled out", rationale: "Can cause acute cholestasis but abdominal ultrasound showed clear, patent biliary ducts with no stones or intra/extrahepatic ductal dilation." }
        ],
        clinicalPearls: [
          "Primary Biliary Cholangitis is characterized by chronic, progressive autoimmune destruction of the small intrahepatic bile ducts, leading to portal inflammation and fibrosis.",
          "In patients with Hashimoto’s Thyroiditis or other autoimmune diseases, there is a significantly increased risk of developing additional autoimmune conditions (polyglandular autoimmunity).",
          "Fatigue and pruritus are the classic early symptoms of PBC, and the severity of itching does not correlate with the degree of liver dysfunction."
        ],
        recommendedWorkup: [
          "Order Serum Anti-Mitochondrial Antibodies (AMA), which are pathognomonic and positive in 95% of PBC cases.",
          "Order quantitative serum immunoglobulins (specifically IgM, which is typically elevated in PBC).",
          "Perform a liver biopsy if serology is atypical or to assess histopathologic staging."
        ],
        emergencyActions: [
          "Consult Gastroenterology / Hepatology for long-term clinical care.",
          "Initiate Ursodeoxycholic Acid (UDCA) at 13-15 mg/kg/day, which is the gold standard therapy to slow disease progression.",
          "Prescribe Cholestyramine (bile acid sequestrant) to manage distressing pruritus."
        ]
      };
    }
    return null;
  };

  const precached = getPrecachedSynthesis(caseId, targetCase);

  // If GEMINI_API_KEY is not defined, we return the precached or a dynamically generated elegant response
  if (!process.env.GEMINI_API_KEY) {
    if (precached) {
      return res.json(precached);
    }
    // Generate a beautiful, smart dynamic fallback for custom cases
    const titleLower = targetCase.title.toLowerCase();
    const complaintLower = targetCase.chief_complaint.toLowerCase();
    let likelyDiagnosis = "Atypical Clinical Presentation";
    let rationaleText = "A clinical review of the symptoms, vital signs, and laboratory tests is required to confirm diagnostic suspicion.";

    if (titleLower.includes("asthma") || complaintLower.includes("wheez") || complaintLower.includes("breath")) {
      likelyDiagnosis = "Acute Bronchial Asthma Exacerbation";
      rationaleText = "Supported by symptoms of expiratory wheeze, breathlessness, and accessory muscle use.";
    } else if (titleLower.includes("pneumonia") || (complaintLower.includes("fever") && complaintLower.includes("cough")) || titleLower.includes("cough")) {
      likelyDiagnosis = "Community-Acquired Pneumonia (CAP)";
      rationaleText = "Consistent with concurrent productive cough, fever, systemic malaise, and localized chest findings.";
    } else if (titleLower.includes("appendi") || complaintLower.includes("abdominal pain") || complaintLower.includes("rlq")) {
      likelyDiagnosis = "Acute Appendicitis";
      rationaleText = "Suggested by localized right lower quadrant abdomen tenderness, fever, and digestive symptoms.";
    }

    return res.json({
      summary: `This is a clinical reasoning simulation of a ${targetCase.age}-year-old ${targetCase.sex.toLowerCase()} patient presenting with a chief complaint of "${targetCase.chief_complaint}". Meta-classification specifies a ${targetCase.difficulty.toLowerCase()} difficulty level within the folder ${targetCase.specialty}. Initial physical parameters, history, and examination metrics have been loaded for peer discussion.`,
      differentialDiagnoses: [
        { diagnosis: likelyDiagnosis, probability: "Primary Suspect", rationale: rationaleText },
        { diagnosis: "Symptomatic Viral Syndrome / Mimic", probability: "Secondary / Exclude", rationale: "May present with general malaise or fever, but needs careful exclusion of structural causes." },
        { diagnosis: "Secondary Systemic Inflammation", probability: "Less likely", rationale: "Important differential to maintain broad systemic safety." }
      ],
      clinicalPearls: [
        "Constructing a comprehensive differential diagnostic list remains the cornerstone of medical reasoning errors prevention.",
        "Ensure vital signs are cross-referenced with laboratory results to screen for systemic decompensation early.",
        "This is an educational folder representation; compare actual clinical guidelines as part of standard curriculum studies."
      ],
      recommendedWorkup: [
        "Complete Blood Count (CBC) with differential, and comprehensive metabolic panel (CMP).",
        "Targeted Diagnostic Imaging (such as Ultrasound, X-Ray, or CT scanning of the affected area).",
        "Continuous monitoring of vital signs and hydration levels."
      ],
      emergencyActions: [
        "Establish intravenous (IV) access and monitor continuous pulse oximetry.",
        "Perform a thorough airway, breathing, and circulation (ABCs) check on initial evaluation.",
        "Initiate supportive care and organize specialist consultation based on preliminary findings."
      ]
    });
  }

  // Real Gemini Call!
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `You are a world-class clinical educator teaching medical students clinical reasoning skills. 
Analyze following fictional medical case report files and provide a highly professional, academic feedback synthesis.

--- CASE HIGHLIGHTS ---
Title: ${targetCase.title}
Specialty: ${targetCase.specialty}
Difficulty: ${targetCase.difficulty}
Patient: ${targetCase.age}yo ${targetCase.sex}
Chief Complaint: "${targetCase.chief_complaint}"
History of Present Illness: ${targetCase.history_present_illness}
Past Medical History: ${targetCase.past_medical_history}
Medications: ${targetCase.medications}
Vitals: ${targetCase.vital_signs}
Physical Exam: ${targetCase.physical_exam}
Labs: ${targetCase.laboratory_results}
Imaging: ${targetCase.imaging_results}
Study Question: ${targetCase.discussion_question}
-------------------------

Generate a structured JSON output representing your clinical peer synthesis.
You MUST output ONLY valid JSON matching this schema exactly (do not wrap in markdown blocks, do not explain):
{
  "summary": "Brief, elegant 3-4 sentence paragraph summarizing the clinical situation, key findings, and final diagnosis.",
  "differentialDiagnoses": [
    {
      "diagnosis": "Diagnosis Name",
      "probability": "Primary / Secondary / Less likely",
      "rationale": "High-yield explanation of why this is suspected based on findings."
    }
  ],
  "clinicalPearls": [
    "Expert learning pearl 1 with high diagnostic value.",
    "Expert learning pearl 2.",
    "Expert learning pearl 3."
  ],
  "recommendedWorkup": [
    "Required next testing step or lab 1.",
    "Required next testing step or lab 2.",
    "Required next testing step or lab 3."
  ],
  "emergencyActions": [
    "Immediate rescue action 1 to stabilize patient.",
    "Immediate rescue action 2.",
    "Immediate rescue action 3."
  ]
}

Ensure the response contains the 5 keys exactly and is valid JSON. Do not include any HTML tags or backticks around the JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    // Sanitize any potential markdown block markers
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const synthesisData = JSON.parse(cleanedText);
    res.json(synthesisData);

  } catch (err: any) {
    console.error("Gemini service failed, fallback to precached content", err);
    if (precached) {
      return res.json(precached);
    }
    return res.status(500).json({ error: "AI Synthesis failed and no pre-cached fallback available." });
  }
});

// View public profile details of clinical students/moderators
app.get("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const profileUser = db.users[userId];
  if (!profileUser) {
    return res.status(404).json({ error: "Profile not found." });
  }

  // Count metrics
  const casesCreated = Object.values(db.cases).filter(c => c.author_id === userId).length;
  const contributionsMade = Object.values(db.contributions).filter(c => c.user_id === userId).length;
  const helpfulCount = Object.values(db.contributions).filter(c => c.user_id === userId && c.is_helpful).length;

  const { passwordHash, ...userPayload } = profileUser;

  res.json({
    user: userPayload,
    stats: {
      casesCreated,
      contributionsMade,
      helpfulCount
    }
  });
});

// Save updated user biography or details
app.post("/api/users/profile", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const user = token ? db.users[token] : null;

  if (!user) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  const { biography, university, academic_year, country } = req.body;
  
  if (biography !== undefined) user.biography = biography;
  if (university !== undefined) user.university = university;
  if (academic_year !== undefined) user.academic_year = academic_year;
  if (country !== undefined) user.country = country;

  saveDb();

  const { passwordHash, ...userPayload } = user;
  res.json(userPayload);
});

// Serve static compiled UI assets in production and Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Clinova server started successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
