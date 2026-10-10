/**
 * AyuLekha Healthcare & Clinical Solution Engine (ESM)
 * Strictly dedicated to providing immediate, comprehensive, step-by-step
 * medical & healthcare solutions for all health problems.
 */

export const RED_FLAGS = [
  {
    id: 'chest_pain',
    triggers: ['chest pain', 'chest pressure', 'heart attack', 'pain radiating to left arm', 'jaw pain with chest tightness', 'crushing chest', 'heart pain', 'squeezing chest', 'chest heaviness'],
    warning: 'CRITICAL EMERGENCY: Potential cardiac event (Heart Attack / Angina) or acute coronary syndrome detected.',
    action: 'Call emergency rescue (911 / 112 / 999 / 108) IMMEDIATELY. Chew 300mg aspirin if not allergic, sit upright, and do NOT drive yourself.'
  },
  {
    id: 'severe_dyspnea',
    triggers: ['cannot breathe', 'severe shortness of breath', 'gasping for air', 'blue lips', 'stridor', 'choking', 'struggling to breathe', 'turning blue', 'suffocating'],
    warning: 'CRITICAL EMERGENCY: Severe respiratory failure or acute airway obstruction.',
    action: 'Seek emergency hospital care or call paramedics right away. Keep the person sitting upright.'
  },
  {
    id: 'stroke_signs',
    triggers: ['facial drooping', 'arm weakness', 'slurred speech', 'sudden numbness one side', 'sudden vision loss', 'fast stroke', 'drooping face', 'paralysis one side'],
    warning: 'CRITICAL EMERGENCY: Suspected Acute Stroke (F.A.S.T: Face, Arms, Speech, Time).',
    action: 'Call emergency medical services immediately. Note the exact time symptoms began. Immediate hospital intervention is time-critical.'
  },
  {
    id: 'severe_anaphylaxis',
    triggers: ['swelling of throat', 'swelling of tongue', 'throat closing', 'anaphylaxis', 'severe allergic reaction with breathing difficulty', 'lip swelling with wheeze'],
    warning: 'CRITICAL EMERGENCY: Anaphylactic Shock with impending airway collapse.',
    action: 'Use an Epinephrine auto-injector (EpiPen) into outer thigh immediately and call emergency services without delay.'
  },
  {
    id: 'severe_head_trauma',
    triggers: ['loss of consciousness', 'knocked out', 'vomiting after head hit', 'unequal pupils', 'seizure after fall', 'head injury with confusion'],
    warning: 'CRITICAL EMERGENCY: Possible Traumatic Brain Injury (TBI) / Intracranial Hemorrhage.',
    action: 'Do not move the neck. Keep patient still and transport via ambulance to emergency neurosurgical care.'
  },
  {
    id: 'severe_bleeding',
    triggers: ['uncontrolled bleeding', 'spurting blood', 'coughing blood', 'vomiting blood', 'black tarry stools with dizziness', 'heavy bleeding that won\'t stop'],
    warning: 'CRITICAL EMERGENCY: Severe internal or arterial hemorrhage.',
    action: 'Apply firm, continuous direct pressure with a clean cloth, elevate the injury site above heart level, and seek immediate emergency care.'
  }
];

// Non-health domain keywords to enforce strict healthcare focus
const NON_HEALTH_KEYWORDS = [
  'crypto', 'bitcoin', 'stock market', 'finance', 'python code', 'javascript', 'programming', 
  'software', 'movie review', 'sports score', 'football match', 'cricket score', 'car repair', 
  'politics', 'election', 'essay writing', 'homework solve', 'gaming', 'video game'
];

export const HEALTH_SOLUTIONS_DATABASE = {
  // 1. Fever, Cold, Cough & Throat
  fever_cold_cough: {
    name: 'Fever, Cold, Cough & Sore Throat',
    keywords: ['fever', 'chills', 'cough', 'sore throat', 'runny nose', 'congestion', 'flu', 'phlegm', 'body ache', 'cold', 'sneezing', 'temperature', 'shivering', 'mucus', 'throat pain', 'blocked nose', 'dry cough', 'wet cough'],
    solution: `
### 🩺 Clinical Overview
Your symptoms indicate an upper respiratory tract infection (viral cold, influenza, or pharyngitis). Fever is your immune system elevating core temperature to stop viral replication, while coughing expels mucus.

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **Temperature & Body Ache Relief:**
   - Take **Paracetamol (Acetaminophen) 500mg - 650mg** every 6 hours with water after food if temperature exceeds 100.4°F (38°C). Maximum 3,000mg/day.
   - For high fever (>101°F / 38.3°C), do lukewarm sponging on forehead, neck, and underarms. Never use ice water.
2. **Throat & Chest Mucus Clearance:**
   - **Warm Saltwater Gargle:** 1/2 teaspoon salt in 1 cup warm water; gargle 3-4 times daily.
   - **Steam Inhalation:** 10-15 minutes twice daily to loosen congested sinuses and chest phlegm.
   - **Honey & Ginger:** 1 tablespoon honey + 1/2 tsp fresh ginger juice 3 times daily to coat inflamed throat lining.
3. **Hydration Target:**
   - Drink **2.5 to 3 Liters of warm fluids daily** (warm water, herbal tulsi/ginger tea, clear broth).
4. **Sleep Posture:**
   - Elevate your head with 2 pillows to prevent post-nasal drip coughing at night.

---

### 🥗 Diet & Restrictions:
• **Eat:** Warm khichdi, dalia, chicken/vegetable soup, boiled eggs, warm milk with 1/4 tsp turmeric (golden milk).  
• **Strictly Avoid:** Cold drinks, ice cream, fried foods, curd at night, alcohol, and smoking.

---

### 🚨 When to See a Doctor:
• Fever above 102.5°F (>39.2°C) persisting for more than 3 days.  
• Severe breathing difficulty, chest pain, or coughing up blood.
`,
    otc: 'Paracetamol 650mg (fever/pain), Guaifenesin syrup (wet cough), Dextromethorphan (dry cough), Cetirizine 10mg (sneezing).',
    specialist: 'General Physician / ENT Specialist'
  },

  // 2. Headache & Migraine
  headache_migraine: {
    name: 'Headache & Migraine Relief',
    keywords: ['headache', 'migraine', 'head pain', 'throbbing head', 'temple pain', 'forehead pain', 'light sensitivity', 'head throbbing', 'head hurts', 'pain in head', 'sinus headache'],
    solution: `
### 🩺 Clinical Overview
Headaches arise from cranial vascular dilation (migraine), pericranial muscle tension from stress/poor posture (tension headache), or dehydration and sinus inflammation.

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **Immediate Sensory Reset:**
   - Lie down in a **completely dark, quiet, cool room**. Turn off mobile and laptop screens immediately.
2. **Cold / Warm Therapy:**
   - **For Throbbing / Migraine:** Apply an ice pack wrapped in a cloth across your forehead or temples for 15 minutes.
   - **For Tension / Neck Tightness:** Place a warm heating pad on the back of your neck and shoulders.
3. **Rapid Hydration:**
   - Drink **500ml of room-temperature water** immediately (dehydration triggers over 40% of headaches).
4. **Pain Relief Medication:**
   - Take **Ibuprofen 400mg** with a light snack OR **Paracetamol 650mg**.
   - A cup of green tea or black coffee early in a migraine helps constrict dilated cranial blood vessels.
5. **Acupressure:**
   - Firmly pinch and massage the **LI-4 acupressure point** (the webbing between thumb and index finger) for 2 minutes on each hand.

---

### 🚨 When to See a Doctor:
• Sudden explosive headache ("thunderclap headache").  
• Headache accompanied by high fever, neck stiffness, confusion, or weakness.
`,
    otc: 'Ibuprofen 400mg (with meals), Paracetamol 650mg.',
    specialist: 'Neurologist / General Physician'
  },

  // 3. Stomach Ache, Acidity, Gas & Bloating
  stomach_acidity_gas: {
    name: 'Stomach Ache, Acidity, Gas & Indigestion',
    keywords: ['stomach ache', 'abdominal pain', 'nausea', 'gas', 'bloating', 'acid reflux', 'heartburn', 'cramps', 'stomach', 'belly pain', 'indigestion', 'tummy ache', 'acidity', 'gerd', 'sour burps', 'gastric'],
    solution: `
### 🩺 Clinical Overview
Digestive discomfort is primarily caused by excess gastric acid secretion, delayed gastric emptying, trapped intestinal gas, or spasms in the gastrointestinal smooth muscles.

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **For Acidity & Heartburn:**
   - Take an **Antacid Gel (2 tablespoons)** or **Famotidine 20mg / Omeprazole 20mg** 30 minutes before meals.
   - Drink 1/2 glass of cold milk or coconut water for instant soothing of the esophageal lining.
   - **Never lie down flat** for at least 2 hours after eating. Sleep with your upper body elevated.
2. **For Gas & Bloating:**
   - Chew 1/2 teaspoon of **roasted fennel seeds (saunf) and cumin (jeera)** with warm water.
   - Walk gently for 10-15 minutes; light movement helps expel trapped abdominal gas.
3. **For Stomach Cramps:**
   - Place a **warm heating pad or hot water bag** on your belly for 15-20 minutes.
   - Sip warm peppermint or chamomile tea slowly.

---

### 🥗 Diet Guidelines:
• **Eat:** Bland soft food, boiled rice with curd (yogurt contains probiotics), oatmeal, boiled potatoes, bananas.  
• **Strictly Avoid:** Deep-fried foods, red chili powder, carbonated sodas, citrus fruits, raw garlic, coffee, and alcohol.

---

### 🚨 When to See a Doctor:
• Severe localized lower right abdomen pain (risk of appendicitis).  
• Black tarry stools or vomiting blood.  
• Inability to keep liquids down for over 12 hours.
`,
    otc: 'Famotidine 20mg, Antacid suspension (Gelusil / Digene), Simethicone 80mg (for gas).',
    specialist: 'Gastroenterologist / Family Physician'
  },

  // 4. Diarrhea, Loose Motion, Vomiting & Food Poisoning
  diarrhea_vomiting_foodpoison: {
    name: 'Diarrhea, Loose Motion & Food Poisoning',
    keywords: ['diarrhea', 'loose motion', 'motions', 'vomiting', 'vomit', 'food poisoning', 'gastroenteritis', 'stomach bug', 'watery stool'],
    solution: `
### 🩺 Clinical Overview
Acute diarrhea and vomiting are usually caused by viral/bacterial gastroenteritis or food-borne toxins. The primary medical priority is preventing rapid dehydration and electrolyte loss.

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **Aggressive Oral Rehydration Therapy (Top Priority):**
   - Mix 1 sachet of **Oral Rehydration Salts (ORS)** in 1 Liter of clean drinking water.
   - Drink 1 cup after every loose bowel movement. Sip slowly in teaspoons if vomiting.
   - Coconut water and salted rice water (kanji) are excellent natural electrolyte sources.
2. **BRAT Diet Protocol:**
   - Eat only binding, gentle foods: **B**anana, **R**ice (plain boiled with curd), **A**pplesauce, and **T**oast / saltine crackers.
3. **Probiotics & Gut Flora Restoration:**
   - Consume plain unflavored yogurt/curd or take a shelf-stable probiotic capsule (e.g. *Lactobacillus*) to restore healthy gut microbiome.
4. **Vomiting Management:**
   - Stop solid food for 3-4 hours after vomiting. Sip cold electrolyte water in small tablespoons.

---

### 🥗 What to Avoid for 48 Hours:
• No dairy milk, cheese, spicy gravies, fried snacks, raw salads, artificial juices, or caffeine.

---

### 🚨 When to See a Doctor:
• High fever (>101.5°F) with bloody or mucus-filled stools.  
• Signs of severe dehydration (sunken eyes, dizziness, no urination for 8 hours).
`,
    otc: 'ORS packets (WHO formulation), Probiotic capsules (Sporlac/Econorm), Ondansetron 4mg (for persistent nausea).',
    specialist: 'Gastroenterologist / General Physician'
  },

  // 5. Constipation & Piles / Hemorrhoids
  constipation_piles: {
    name: 'Constipation & Hemorrhoids (Piles)',
    keywords: ['constipation', 'hard stool', 'piles', 'hemorrhoids', 'anal pain', 'straining stool', 'cannot poop', 'bowel movement hard'],
    solution: `
### 🩺 Clinical Overview
Constipation is caused by inadequate dietary fiber, low water intake, and slow colonic transit, leading to hard, dry stools that cause straining and inflamed hemorrhoidal veins.

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **High Dietary Fiber & Water Protocol:**
   - Drink **1 to 2 glasses of warm water** immediately upon waking in the morning.
   - Consume **Psyllium Husk (Isabgol):** Mix 1-2 tablespoons in a glass of warm milk or water before bed.
   - Increase soluble fiber intake: Papaya, prunes, figs (anjeer), oats, flaxseeds, and green leafy vegetables.
2. **Sitz Bath for Anal Pain & Piles:**
   - Sit in a tub of warm water for 15-20 minutes twice daily. This relaxes the anal sphincter muscle, reduces swelling, and provides immediate pain relief.
3. **Stool Softener:**
   - Take **Lactulose Syrup (15-30ml)** or **Polyethylene Glycol (PEG)** at bedtime to draw water into stool.
4. **Toileting Ergonomics:**
   - Use a small footstool to elevate your knees while sitting on the toilet (squatting posture aligns the rectum naturally). Do not strain or sit on the toilet for more than 5 minutes.

---

### 🚨 When to See a Doctor:
• Rectal bleeding with severe anal pain.  
• No bowel movement for more than 4-5 days despite laxatives.
`,
    otc: 'Isabgol (Psyllium husk), Lactulose syrup 15ml, Anovate/Proctosedyl ointment (for piles).',
    specialist: 'Colorectal Surgeon / Gastroenterologist'
  },

  // 6. Skin Rash, Itching, Hives, Fungal & Eczema
  skin_rash_itching: {
    name: 'Skin Rash, Itching, Hives & Fungal Infections',
    keywords: ['rash', 'itchy', 'hives', 'eczema', 'skin redness', 'bumps', 'allergy', 'itching', 'skin', 'welts', 'red spots', 'skin allergy', 'ringworm', 'fungal infection', 'dermatitis'],
    solution: `
### 🩺 Clinical Overview
Skin rashes represent an inflammatory histamine reaction (hives/urticaria), contact irritant dermatitis, eczema barrier breakdown, or superficial fungal colonization (tinea/ringworm).

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **Block Histamine & Itching:**
   - Take **Cetirizine 10mg** or **Loratadine 10mg** (oral antihistamine) once daily.
2. **Topical Soothing & Barrier Repair:**
   - **For Allergic Itch / Hives:** Apply **Calamine lotion** or **1% Hydrocortisone cream** thinly twice daily.
   - **For Fungal / Ringworm (Circular scaling rash):** Apply **Clotrimazole 1% or Terbinafine 1% antifungal cream** twice daily for 2 weeks. Keep area completely dry.
   - **For Dry Eczema:** Apply pure coconut oil or fragrance-free ceramide moisturizer within 3 minutes after showering.
3. **Cool Compress:**
   - Lay a cool, damp cotton towel over the itchy skin for 10-15 minutes to constrict dilated capillaries.
4. **Hygiene Rules:**
   - Wear loose 100% cotton clothing. Keep nails trimmed short to avoid secondary bacterial infection from scratching.

---

### 🚨 When to See a Doctor:
• Swelling spreading to lips, face, or difficulty breathing (anaphylaxis).  
• Rash covering large body areas with blistering or fever.
`,
    otc: 'Cetirizine 10mg, Calamine lotion, 1% Hydrocortisone cream, Clotrimazole cream (for fungal).',
    specialist: 'Dermatologist / Allergist'
  },

  // 7. Acne & Pimples
  acne_pimples: {
    name: 'Acne, Pimples & Blemishes',
    keywords: ['acne', 'pimples', 'pimple', 'blackheads', 'whiteheads', 'breakout', 'face spots', 'cystic acne', 'skin breakouts'],
    solution: `
### 🩺 Clinical Overview
Acne occurs when hair follicles are clogged with excess sebum oil and dead skin cells, leading to colonization by *Cutibacterium acnes* bacteria and localized inflammation.

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **Daily Cleansing Routine:**
   - Wash face twice daily with a **Salicylic Acid (1-2%)** or **Benzoyl Peroxide (2.5-5%)** foaming cleanser. Do not scrub harshly.
2. **Targeted Spot Treatment:**
   - Apply a small dot of **Benzoyl Peroxide 2.5% gel** or **Clindamycin gel** directly on active pimples at night.
   - Apply an ice cube wrapped in a paper towel on painful inflamed red pimples for 2 minutes to reduce swelling.
3. **Moisture & Sun Protection:**
   - Use an oil-free, non-comedogenic gel moisturizer and SPF 50 sunscreen.
4. **Golden Rule:**
   - **Never pop or squeeze pimples!** Popping pushes bacteria deeper into the dermis and leaves permanent scars.

---

### 🥗 Diet & Lifestyle:
• Cut down high-glycemic sugar, junk food, and excess whey protein. Drink 2.5L water daily. Change pillowcases every 3-4 days.
`,
    otc: 'Benzoyl Peroxide 2.5% gel, Salicylic acid face wash, Hydrocolloid pimple patches.',
    specialist: 'Dermatologist'
  },

  // 8. Hair Fall & Dandruff
  hair_fall_dandruff: {
    name: 'Hair Fall, Dandruff & Scalp Care',
    keywords: ['hair fall', 'hair loss', 'dandruff', 'scalp itching', 'hair thinning', 'falling hair', 'flaky scalp', 'alopecia'],
    solution: `
### 🩺 Clinical Overview
Excessive hair shedding (telogen effluvium) is commonly triggered by nutritional deficiencies (Iron/Ferritin, Biotin, Vitamin D), stress, or scalp inflammation from fungal dandruff (*Malassezia* overgrowth).

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **For Flaky Dandruff & Scalp Itch:**
   - Use a **Ketoconazole 2% or Zinc Pyrithione (ZPTO)** anti-dandruff shampoo 2 to 3 times a week. Leave the lather on your scalp for 5 minutes before rinsing.
2. **Nutritional Hair Support:**
   - Ensure adequate intake of: **Iron/Hemoglobin** (spinach, beetroot, pomegranate), **Zinc & Biotin** (eggs, almonds, walnuts, pumpkin seeds), and **Vitamin D3**.
3. **Gentle Scalp Care:**
   - Warm coconut oil or rosemary essential oil massage (diluted in carrier oil) 1 hour before hair wash.
   - Avoid daily heat styling, harsh bleaching, and tight pulling hairstyles.

---

### 🚨 When to See a Doctor:
• Sudden patchy round bald spots (Alopecia Areata).  
• Severe hair loss persisting for over 3 months.
`,
    otc: 'Ketoconazole 2% shampoo, Biotin & Multivitamin supplements.',
    specialist: 'Dermatologist / Trichologist'
  },

  // 9. Back Pain & Muscle Strain
  back_pain_muscle: {
    name: 'Back Pain, Sciatica & Muscle Spasm',
    keywords: ['back pain', 'lower back pain', 'sciatica', 'backache', 'muscle strain', 'spasm', 'stiff back', 'lumbar pain', 'waist pain', 'spondylitis', 'neck pain'],
    solution: `
### 🩺 Clinical Overview
Back pain is most commonly mechanical, caused by lumbar myofascial strain, poor ergonomics, core muscle weakness, or vertebral disc compression irritating spinal nerve roots.

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **Heat / Cold Strategy:**
   - **First 48 Hours:** Apply ice packs for 15-20 minutes every 3-4 hours if pain started after lifting or a sudden twist.
   - **After 48 Hours:** Apply a warm heating pad for 20 minutes to relax locked muscular spasms.
2. **Topical & Oral Pain Relief:**
   - Apply **Diclofenac Gel (1%)** or warm pain ointment directly over the sore lumbar area 3 times daily.
   - Take **Ibuprofen 400mg** with meals OR **Paracetamol 650mg**.
3. **Movement & Ergonomics:**
   - **Do not stay on prolonged bed rest!** Take gentle 5-10 minute walks every 2-3 hours on flat ground.
   - Sleep on your side with a pillow placed between your knees, or on your back with a pillow under your knees.
4. **Gentle Stretches:**
   - Perform Cat-Cow stretch, Knee-to-Chest stretch, and Pelvic Tilts once acute pain subsides.

---

### 🚨 When to See a Doctor Immediately:
• Numbness/weakness radiating down the legs, or loss of bladder/bowel control (Cauda Equina warning).
`,
    otc: 'Topical Diclofenac gel (Voltaren/Volini), Ibuprofen 400mg with food.',
    specialist: 'Orthopedic Doctor / Physiotherapist / Spine Specialist'
  },

  // 10. Joint Pain, Knee Pain & Arthritis
  joint_knee_pain_arthritis: {
    name: 'Joint Pain, Knee Pain, Arthritis & Gout',
    keywords: ['joint pain', 'knee pain', 'arthritis', 'gout', 'swollen joint', 'stiff joint', 'uric acid', 'rheumatism', 'knee swelling', 'joint stiffness'],
    solution: `
### 🩺 Clinical Overview
Joint discomfort stems from articular cartilage wear (osteoarthritis), systemic synovial inflammation (rheumatoid arthritis), or uric acid crystal accumulation (gout).

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **Immediate Relief for Inflamed Joints:**
   - Apply **Ice packs** for 15 minutes for acute swollen/hot joints (especially gout flare-ups).
   - Apply **Warm compresses** for morning stiffness in chronic arthritis.
2. **Topical Anti-Inflammatory Application:**
   - Massage **Diclofenac 1% gel** or warm sesame oil infused with ginger onto the joint 3 times daily.
3. **Weight Management & Joint Offloading:**
   - Wear supportive, cushioned orthopedic footwear.
   - Low-impact exercises: swimming or stationary cycling to strengthen quadriceps without joint impact.
4. **Anti-Inflammatory Nutrition:**
   - **Turmeric (Curcumin) with black pepper** (potent natural anti-inflammatory).
   - Omega-3 fatty acids (flaxseeds, walnuts, fish oil).
   - *For Gout (High Uric Acid):* Strictly avoid red meat, organ meats, beer, seafood, and high-fructose corn syrup. Drink 3L water daily.

---

### 🚨 When to See a Doctor:
• Joint is intensely red, hot to touch, with sudden severe pain and fever.
`,
    otc: 'Diclofenac gel, Glucosamine-Chondroitin, Paracetamol 650mg.',
    specialist: 'Rheumatologist / Orthopedic Specialist'
  },

  // 11. Toothache & Oral Issues
  toothache_mouth_ulcer: {
    name: 'Toothache, Bleeding Gums & Mouth Ulcers',
    keywords: ['toothache', 'tooth pain', 'teeth pain', 'bleeding gums', 'mouth ulcer', 'canker sore', 'cavity', 'sensitive teeth', 'gum pain'],
    solution: `
### 🩺 Clinical Overview
Toothaches are caused by dental pulp inflammation from cavities, cracked enamel, or gum infection (periodontitis). Mouth ulcers are localized mucosal erosions from stress, vitamin B12/iron deficiency, or accidental biting.

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **For Acute Toothache:**
   - **Clove Oil Remedy:** Dip a small cotton ball in **Clove Oil (Eugenol)** and place it directly on the aching tooth for 10-15 minutes (potent natural local anesthetic and antibacterial).
   - **Warm Saltwater Rinse:** Swish warm salt water around the mouth for 1 minute to flush food debris and reduce bacteria.
   - Take **Ibuprofen 400mg** or **Paracetamol 650mg** for pain relief.
2. **For Mouth Ulcers (Canker Sores):**
   - Apply **Choline Salicylate + Tannic acid oral gel** or pure honey directly onto the ulcer 3 times daily before meals.
   - Take Vitamin B-Complex with Zinc and Folic acid supplements.
3. **Dental Hygiene:**
   - Floss gently and brush with a soft-bristled toothbrush. Avoid very hot, cold, or sugary foods.

---

### 🚨 When to See a Dentist:
• Visible facial swelling, pus discharge, or tooth pain lasting > 48 hours.
`,
    otc: 'Clove oil, Ibuprofen 400mg, Orajel / Mucopain gel, Vitamin B-Complex.',
    specialist: 'Dentist / Dental Surgeon'
  },

  // 12. Eye Strain, Redness & Conjunctivitis
  eye_strain_conjunctivitis: {
    name: 'Eye Strain, Red Eyes & Conjunctivitis (Pink Eye)',
    keywords: ['eye pain', 'red eyes', 'eye strain', 'dry eyes', 'conjunctivitis', 'pink eye', 'watery eyes', 'burning eyes', 'eye irritation', 'stye'],
    solution: `
### 🩺 Clinical Overview
Eye irritation is caused by screen-induced digital eye strain (reduced blink rate), allergic conjunctivitis, environmental dry eye syndrome, or viral/bacterial pink eye.

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **The 20-20-20 Rule for Screen Strain:**
   - Every 20 minutes of screen time, look at an object 20 feet away for 20 seconds.
2. **Lubricating Eye Drops:**
   - Instill preservative-free **Carboxymethylcellulose (CMC 0.5%)** artificial tears (1-2 drops, 3-4 times daily) to hydrate the cornea.
3. **Cold / Warm Eye Compresses:**
   - **For Itchy / Allergic Red Eyes:** Place a clean cold wet washcloth or chilled cucumber slices over closed eyes for 10 minutes.
   - **For Eye Stye (Eyelid bump):** Place a warm, moist washcloth on the closed eyelid for 10 minutes 3 times daily.
4. **Crucial Hygiene Rules:**
   - Never rub your eyes (transfers bacteria and damages cornea).
   - Remove contact lenses immediately until the irritation completely resolves.

---

### 🚨 When to See an Eye Doctor Immediately:
• Severe eye pain, sensitivity to light (photophobia), or blurred vision.
`,
    otc: 'Carboxymethylcellulose 0.5% (Refresh Tears / Tears Naturale).',
    specialist: 'Ophthalmologist / Optometrist'
  },

  // 13. Urinary Tract Infection (UTI) & Burning Urination
  uti_urinary_burning: {
    name: 'Urinary Tract Infection (UTI) & Burning Sensation',
    keywords: ['uti', 'urine', 'urinary', 'urination', 'pee', 'peeing', 'burning urine', 'burning pee', 'urine pain', 'frequent urination', 'kidney stone', 'bladder infection', 'burning sensation in urine'],
    solution: `
### 🩺 Clinical Overview
Burning urination (dysuria) and urgency are most commonly caused by bacterial proliferation in the urethra/bladder (usually *E. coli*), dehydration, or crystal irritation.

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **Flush the Urinary Tract with Water:**
   - Drink **3 to 3.5 Liters of water daily**. High fluid throughput flushes bacteria out of the bladder lining.
2. **Urine Alkalinizer:**
   - Drink **1 glass of water with 1/2 teaspoon baking soda** or an OTC **Potassium / Disodium Hydrogen Citrate syrup** (2 teaspoons in 1 glass water twice daily) to neutralize acidic urine and stop the burning sensation immediately.
3. **Unsweetened Pure Cranberry Extract:**
   - Cranberry contains PACs (proanthocyanidins) that prevent bacteria from sticking to bladder walls.
4. **Hygiene & Emptying:**
   - Empty your bladder fully and frequently; never hold in urine.

---

### 🚨 When to See a Doctor for Antibiotics:
• Fever, chills, severe lower back/flank pain (indicates kidney involvement).  
• Visible blood in the urine (hematuria).
`,
    otc: 'Citro-Soda / Disodium hydrogen citrate liquid, Cranberry D-Mannose supplements, Paracetamol.',
    specialist: 'Urologist / Nephrologist / General Physician'
  },

  // 14. Menstrual Cramps & Period Pain
  period_menstrual_cramps: {
    name: 'Menstrual Cramps (Period Pain) & PMS',
    keywords: ['period pain', 'menstrual cramps', 'periods cramp', 'dysmenorrhea', 'pms', 'pcos', 'heavy periods', 'uterus pain'],
    solution: `
### 🩺 Clinical Overview
Menstrual cramps are triggered by elevated prostaglandins causing the uterine myometrium to contract and shed the endometrial lining.

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **Heat Therapy (Gold Standard):**
   - Apply a **warm heating pad or hot water bottle** to your lower abdomen and pelvis for 20-30 minutes. Heat is clinically proven to be as effective as analgesics by relaxing uterine muscles.
2. **Prostaglandin Inhibition (Pain Relief):**
   - Take **Mefenamic Acid 250-500mg** (or **Ibuprofen 400mg**) with food at the earliest onset of cramps. Prostaglandin inhibitors block the root cause of uterine spasms.
3. **Warm Herbal Teas & Spices:**
   - Drink warm ginger tea, chamomile tea, or cinnamon tea. Ginger naturally inhibits inflammatory leukotrienes.
4. **Gentle Stretching:**
   - Try the Child's Pose (Balasana) and Cat-Cow yoga poses to decompress pelvic pressure.

---

### 🥗 Diet & Restrictions:
• Increase Magnesium (dark chocolate, bananas, almonds). Cut down excess salt (reduces water bloating) and caffeine.
`,
    otc: 'Mefenamic Acid (Meftal-Spas), Ibuprofen 400mg, Magnesium glycinate.',
    specialist: 'Gynecologist'
  },

  // 15. Minor Burns & Scalds
  minor_burns_cuts: {
    name: 'Minor Burns, Cuts, Scrapes & Bruises',
    keywords: ['burn', 'burned', 'burnt', 'burning skin', 'scald', 'hot pan', 'hot oil', 'hot water burn', 'hot iron', 'minor burn', 'cut', 'wound', 'scrape', 'bleeding cut', 'bruise', 'sunburn', 'blister from burn', 'blisters on burn'],
    solution: `
### 🩺 Clinical Overview
Immediate first aid determines tissue recovery, minimizes scar formation, and prevents bacterial contamination in dermal injuries.

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **For Minor Burns (First Degree / Small Second Degree):**
   - **Cool Running Water:** Hold the burn under cool running tap water for **10 to 15 continuous minutes**. Never apply ice, butter, or toothpaste (they trap heat and damage tissue).
   - Apply pure **Aloe Vera Gel** or **Silver Sulfadiazine / Burnol cream** gently.
   - Cover loosely with sterile non-stick gauze.
2. **For Minor Cuts & Bleeding Scrapes:**
   - Apply continuous firm pressure with a clean cloth for 3-5 minutes until bleeding stops.
   - Wash with mild soap and clean water to remove dirt.
   - Apply an **Antibacterial Ointment (Neosporin / Bacitracin / Betadine)** and cover with a clean bandage.
3. **For Bruises:**
   - Apply an ice pack for 15 minutes to reduce capillary bleeding under the skin.

---

### 🚨 When to Seek Emergency Hospital Care:
• Burns covering large areas, face, hands, or with white/charred skin (3rd degree).  
• Deep cuts where edges gape open (needs stitches), or rusty nail punctures (needs Tetanus shot).
`,
    otc: 'Silver Sulfadiazine cream (Burnol/Silvadene), Neosporin / Betadine, Sterile gauze bandages.',
    specialist: 'General Surgeon / Emergency Care'
  },

  // 16. Stress, Anxiety & Sleep Concerns
  stress_anxiety_sleep: {
    name: 'Stress, Anxiety & Sleep Problems',
    keywords: ['anxiety', 'panic', 'stress', 'insomnia', 'cannot sleep', 'racing thoughts', 'palpitations from worry', 'burnout', 'depressed', 'fear', 'tension', 'nervous', 'sleep problem', 'worry', 'restless'],
    solution: `
### 🩺 Clinical Overview
Anxiety, panic, and insomnia result from hyperactivation of the sympathetic nervous system, releasing excess adrenaline and cortisol that keep heart rate elevated and brain in hyper-vigilant state.

---

### ⚡ Step-by-Step Healthcare Action Plan:
1. **Box Breathing (4-4-4-4 Technique - 2 Minute Heart Rate Reset):**
   - Inhale through nose for 4 seconds, hold breath for 4 seconds, exhale through mouth for 4 seconds, hold empty for 4 seconds. Repeat 6-8 cycles to activate the calming vagus nerve.
2. **5-4-3-2-1 Sensory Grounding for Panic/Anxiety:**
   - Mentally identify: **5** objects you see, **4** textures you can touch, **3** sounds you hear, **2** scents you smell, and **1** positive affirmation.
3. **Sleep Hygiene Protocol Tonight:**
   - **No digital screens 60 minutes before bed** (blue light blocks melatonin release).
   - Sip warm chamomile or ashwagandha tea with a pinch of nutmeg 30 minutes before sleep.
   - Keep bedroom temperature cool (18-20°C / 65-68°F) and completely dark.
4. **Strict Daytime Rule:**
   - No coffee, tea, or energy drinks after 1:00 PM. Take a 20-minute morning sunlight walk.
`,
    otc: 'Chamomile tea, Melatonin (0.5mg - 3mg for short term sleep reset), Magnesium Glycinate.',
    specialist: 'Psychologist / Psychiatrist / General Physician'
  }
};

/**
 * Checks for critical emergency red flags
 */
export function checkForRedFlags(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const flag of RED_FLAGS) {
    for (const trigger of flag.triggers) {
      if (lower.includes(trigger)) {
        return flag;
      }
    }
  }
  return null;
}

/**
 * Checks if query is non-medical
 */
export function isNonHealthQuery(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  for (const kw of NON_HEALTH_KEYWORDS) {
    if (lower.includes(kw)) {
      return true;
    }
  }
  return false;
}

/**
 * Matches user query to relevant health solution
 */
export function matchHealthSolution(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  for (const [key, category] of Object.entries(HEALTH_SOLUTIONS_DATABASE)) {
    let score = 0;
    for (const kw of category.keywords) {
      if (lower.includes(kw)) {
        // Longer and more specific keywords get higher weight
        score += kw.length > 4 ? 3 : 1;
        const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lower)) {
          score += 3;
        }
      }
    }
    if (score > highestScore && score >= 2) {
      highestScore = score;
      bestMatch = { id: key, ...category };
    }
  }

  return bestMatch;
}

/**
 * Generates direct, strict healthcare solutions for all user requests
 */
export function generateAyuLekhaSolution(message) {
  // 1. Check emergency red flags
  const redFlag = checkForRedFlags(message);
  if (redFlag) {
    return {
      isEmergency: true,
      categoryName: 'Emergency Warning',
      reply: `🚨 **CRITICAL EMERGENCY MEDICAL ALERT**\n\n**Warning Detected:** ${redFlag.warning}\n\n**Immediate Action Required:**\n• ${redFlag.action}\n• Call emergency medical helpline (911 / 112 / 999 / 108) immediately.\n• Please do not delay or attempt to drive yourself.`,
      specialist: 'Emergency Department (ED / ER) / Paramedics'
    };
  }

  // 2. Strict non-health query filter
  if (isNonHealthQuery(message)) {
    return {
      isEmergency: false,
      categoryName: 'AyuLekha Healthcare Notice',
      reply: `
### 🌿 Dedicated Healthcare AI Assistant
I am **AyuLekha**, a dedicated Healthcare & Clinical AI assistant. I strictly specialize in **medical solutions, disease recovery, home remedies, OTC medications, and clinical wellness guidance**.

Please describe any health problem, illness, pain, or symptom you or your family are experiencing (e.g. *fever, headache, stomach ache, back pain, skin rash, dental pain, cough, etc.*), and I will immediately provide you with a complete step-by-step treatment plan.
`,
      specialist: 'General Physician'
    };
  }

  // 3. Match against extensive medical database
  const matched = matchHealthSolution(message);

  if (matched) {
    return {
      isEmergency: false,
      categoryName: matched.name,
      reply: matched.solution,
      otcGuidance: matched.otc,
      specialist: matched.specialist
    };
  }

  // 4. Dynamic comprehensive healthcare protocol for any other symptom
  return {
    isEmergency: false,
    categoryName: 'Clinical Healthcare Action Plan',
    reply: `
### 🩺 Clinical Analysis & Care Guidance
Based on the health concern you described (*"${message}"*), here is a direct, evidence-based healthcare protocol to relieve discomfort and support recovery:

---

### ⚡ What You Should Do Right Now (Step-by-Step Action Plan):

1. **Rest & Vital Support:**
   - Stop strenuous physical activities. Rest in a well-ventilated, quiet space to allow your body to divert metabolic energy toward healing.
2. **Hydration & Electrolytes:**
   - Drink **2.5 Liters of warm fluids daily** (warm water, light herbal teas, clear broths, coconut water) to maintain cellular hydration and flush metabolic waste.
3. **Targeted Symptom Relief:**
   - **For Pain / Fever / Body Ache:** Take **Paracetamol (Acetaminophen) 500mg-650mg** with a light snack every 6 hours if needed.
   - **For Local Muscular Discomfort:** Apply a warm heating pad or cool compress depending on swelling.
   - **For Digestive Upset:** Follow a bland diet (bananas, rice, curd, oats) and avoid oily, spicy, and dairy-heavy meals.
4. **Observation & Monitoring:**
   - Note if your symptoms improve within 24 to 48 hours following this rest and supportive care protocol.

---

### 🚨 When to See a Doctor:
• High fever (>102°F / 38.9°C) persisting for over 3 days.  
• Severe difficulty breathing, chest tightness, or intense localized pain.  
• Symptoms worsening continuously despite home care.
`,
    otcGuidance: 'Paracetamol 650mg for aches/fever, Oral Rehydration Salts (ORS) for fluid support.',
    specialist: 'General Physician / Family Doctor'
  };
}
