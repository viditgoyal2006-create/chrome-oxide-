/**
 * Technical Reference Data and Chemical Standards
 * Standard: ISO 5398-1:2007 (IULTCS/IUC 8-1) / ASTM D2807 / IS 582 (Method L:2)
 * Determination of Chromium Oxide (% Cr2O3) in Chrome-Tanned Leather
 */

window.LAB_STANDARDS = {
  specification: {
    title: "Leather - Chemical determination of chromic oxide content - Part 1: Quantification by titration",
    standardCode: "ISO 5398-1:2007 / ASTM D2807 / IS 582:1970",
    methodType: "Wet Acid Digestion (HNO3 + HClO4) & Iodometric Titration",
    specimenMass: "1.5000 ± 0.0500 g",
    nitricAcidConc: "15 mL concentrated HNO3 (68-70%)",
    perchloricAcidConc: "10 mL perchloric acid HClO4 (70%)",
    digestionTemp: "110 °C - 130 °C (gentle boil until ruby-orange)",
    dilutionVolume: "150 mL distilled water",
    reagentKI: "10 mL 10% (m/v) Potassium Iodide solution",
    acidificationHCl: "10 mL dilute HCl (1:1 v/v)",
    titrantStandard: "0.1000 mol/L (0.1 N) Sodium Thiosulfate (Na2S2O3)",
    indicator: "Starch Indicator Solution (1.0% m/v, 2 mL added near endpoint)",
    endpointHue: "Inky blue-black sharp transition to clear light bottle green (Cr3+)",
    stoichMeqFactor: 0.025333 // 1 mL 0.1 N Na2S2O3 = 0.002533 g Cr2O3
  },

  // Footwear Leather Test Specimens Catalog
  specimens: [
    {
      id: "bovine-upper",
      name: "Full Chrome Bovine Shoe Upper Leather (Wet-Blue / Crust)",
      category: "Casual & Dress Shoe Upper",
      tannage: "Basic Chromium Sulfate (33% Basicity)",
      finish: "Full-Grain Aniline / Semi-Aniline",
      moisturePercent: 12.5,
      nominalWeight: 1.5240,
      expectedTitre: 22.40,
      blankTitre: 0.15,
      expectedCr2O3AsIs: 3.69,
      expectedCr2O3Dry: 4.22,
      minRequirementDry: 2.50,
      shrinkageTemp: "≥ 100 °C (Boil-Proof)",
      complianceText: "Meets ISO/BIS requirements for Full Chrome Shoe Upper Leather (Min 2.5% Cr₂O₃)."
    },
    {
      id: "goat-glazed",
      name: "Glazed Kid Goat Upper Leather",
      category: "Premium Footwear Upper",
      tannage: "High-Basicity Chrome Tanned",
      finish: "Glazed Grain Finish",
      moisturePercent: 11.8,
      nominalWeight: 1.5120,
      expectedTitre: 24.10,
      blankTitre: 0.15,
      expectedCr2O3AsIs: 4.02,
      expectedCr2O3Dry: 4.56,
      minRequirementDry: 2.50,
      shrinkageTemp: "≥ 105 °C (Boil-Proof)",
      complianceText: "High chromium fixation ensuring excellent moldability and high shrinkage temperature."
    },
    {
      id: "lining-pigskin",
      name: "Chrome Tanned Shoe Lining Leather",
      category: "Footwear Inner Lining",
      tannage: "Semi-Chrome / Mild Chrome Tanned",
      finish: "Soft Buffed Grain",
      moisturePercent: 13.2,
      nominalWeight: 1.5300,
      expectedTitre: 11.80,
      blankTitre: 0.15,
      expectedCr2O3AsIs: 1.93,
      expectedCr2O3Dry: 2.22,
      minRequirementDry: 1.50,
      shrinkageTemp: "≥ 85 °C",
      complianceText: "Complies with Shoe Lining Standard (Min 1.5% Cr₂O₃), providing soft touch and sweat resistance."
    },
    {
      id: "military-boot",
      name: "Full Chrome Waterproof Military Combat Boot Upper",
      category: "Heavy Duty Military & Safety Footwear",
      tannage: "Heavy Chrome Tanning with Hydrophobic Retanning",
      finish: "Water-Repellent Waxy Pull-Up",
      moisturePercent: 10.5,
      nominalWeight: 1.5050,
      expectedTitre: 25.80,
      blankTitre: 0.15,
      expectedCr2O3AsIs: 4.32,
      expectedCr2O3Dry: 4.83,
      minRequirementDry: 3.50,
      shrinkageTemp: "≥ 110 °C (Boil-Proof)",
      complianceText: "Exceeds tactical footwear standards (Min 3.5% Cr₂O₃) for extreme moisture and heat endurance."
    }
  ],

  // Student Practical Guide: Step-by-Step Procedure for each step (1 to 8)
  studentPracticalGuide: {
    1: {
      how: "1. Place a clean, dry borosilicate watch glass onto the analytical balance pan.<br>2. Click <strong>'Tare Balance'</strong> to calibrate the zero baseline (0.0000 g).<br>3. Click <strong>'Transfer Leather Specimen'</strong> to quantitatively transfer the finely diced sample (~1.5000 g) using the micro-spatula. The exact specimen weight W is recorded automatically."
    },
    2: {
      how: "1. Ensure the reflux condenser funnel is securely mounted in the neck of the 500 mL Erlenmeyer flask inside the active perchloric fume cupboard.<br>2. Click <strong>'Pour 15 mL Conc. HNO₃'</strong> to begin protein digestion.<br>3. Click <strong>'Pour 10 mL 70% HClO₄'</strong> to charge the primary wet-oxidizing agent.<br><em>Safety Rule:</em> Always add nitric acid before perchloric acid to prevent uncontrolled organic deflagration."
    },
    3: {
      how: "1. Click <strong>'Turn ON Heating Mantle (125 °C)'</strong> to initiate wet thermal digestion.<br>2. Observe boiling accompanied by dense red-brown nitrogen dioxide (NO₂) fumes as collagen peptide chains break down.<br>3. Watch the solution transform from murky green (Cr³⁺) to a luminous ruby-orange dichromate (Cr₂O₇²⁻). Maintain a gentle boil for 1–2 minutes to ensure quantitative oxidation, then click <strong>'Stop Heating'</strong>."
    },
    4: {
      how: "1. Allow the flask to cool below 25 °C.<br>2. Click <strong>'Pour 150 mL Distilled H₂O'</strong> to quench and dissolve all oxidized chromium salts.<br>3. Click <strong>'Boil 5 min to Expel Cl₂ & Cool'</strong> to purge dissolved elemental chlorine gas, which would otherwise cause severe positive iodometric errors."
    },
    5: {
      how: "1. Verify that the flask is thoroughly cooled to ambient temperature (&lt; 25 °C).<br>2. Click <strong>'Pour 10 mL 10% KI + HCl'</strong>. The solution instantly shifts from orange to dark reddish-brown as elemental iodine (I₂) is quantitatively liberated.<br>3. Click <strong>'Incubate in Dark (10 min)'</strong> to complete the stoichiometric redox conversion without photochemical iodine loss."
    },
    6: {
      how: "1. Click <strong>'Fill Burette with 0.1 N Na₂S₂O₃'</strong> to prime the Class-A burette and align the meniscus precisely at 0.00 mL.<br>2. Click <strong>'Start Magnetic Stirrer'</strong> to place a PTFE octagonal stir bar inside the flask, place it over the white contrast tile, and begin smooth vortex mixing."
    },
    7: {
      how: "1. Click <strong>'Continuous Titration (Rapid)'</strong> to titrate with standardized 0.1000 N Na₂S₂O₃ until the dark brown iodine fades to a pale straw-yellow hue (~18 mL).<br>2. Click <strong>'Add 2 mL Starch Indicator'</strong> to form the intense inky blue-black starch-triiodide complex.<br>3. Use <strong>'Dropwise Titration (0.05 mL)'</strong> until the blue color sharp-flashes to an immaculate, crystal-clear light bottle-green (Cr³⁺) endpoint."
    },
    8: {
      how: "1. Review the stoichiometric titration equivalence values (<em>V</em>₁, <em>V</em>₀, <em>N</em>, <em>W</em>).<br>2. Analyze the calculated Cr₂O₃ percentage on both as-received and moisture-free dry bases.<br>3. Check footwear standard compliance against ISO 20344 / IS 582 requirements, then click <strong>'Print / Export Official Certificate'</strong>."
    }
  },

  // Complete Apparatus and Materials Checklist by Step
  stepApparatusDirectory: {
    1: [
      { name: "Chrome-Tanned Leather Specimen", spec: "Cut into 2 mm × 2 mm squares, sampled per ISO 2418" },
      { name: "Digital Analytical Balance", spec: "Readability 0.0001 g (0.1 mg), Mettler Toledo Class I", image: "assets/analytical_balance.png" },
      { name: "Watch Glass / Weighing Boat", spec: "Borosilicate 3.3 glass, 60 mm diameter, pre-cleaned and dried" },
      { name: "Stainless Steel Micro-Spatula", spec: "Polished spoon-ended spatula for precision transfer" }
    ],
    2: [
      { name: "500 mL Erlenmeyer Conical Flask", spec: "Borosilicate 3.3 high-thermal resistance glass", image: "assets/conical_flask_500ml.png" },
      { name: "Short-Stem Glass Funnel", spec: "Diameter 45 mm, inserted in neck as reflux air condenser" },
      { name: "Concentrated Nitric Acid (HNO₃)", spec: "Analytical grade (68-70%), d = 1.42 g/cm³, 15 mL aliquot" },
      { name: "Perchloric Acid (HClO₄)", spec: "Analytical grade (70%), d = 1.67 g/cm³, 10 mL aliquot" },
      { name: "Safety Fume Cupboard", spec: "Perchloric acid certified with water-wash manifold and face sash" }
    ],
    3: [
      { name: "Electric Heating Mantle / Hotplate", spec: "Variable 0–400 °C PID thermostatic control" },
      { name: "Digital Surface Temperature Probe", spec: "Type K thermocouple reading 110–130 °C" },
      { name: "Perchloric Fume Washdown System", spec: "Continuous exhaust velocity > 0.5 m/s" },
      { name: "Personal Protective Equipment", spec: "Face shield, neoprene acid gloves, lab apron" }
    ],
    4: [
      { name: "Grade 3 Distilled Water Dispenser", spec: "Wash bottle dispensing 150 mL conforming to ISO 3696", image: "assets/wash_bottle.png" },
      { name: "Anti-Bumping Glass Boiling Beads", spec: "Clean 3 mm spherical borosilicate beads" },
      { name: "Cooling Water Bath", spec: "Circulating cold water bath at 15–20 °C" }
    ],
    5: [
      { name: "Potassium Iodide Solution (KI)", spec: "10% (m/v) freshly prepared in iodate-free water, 10 mL" },
      { name: "Dilute Hydrochloric Acid (HCl)", spec: "1:1 (v/v) analytical grade for acidification, 10 mL" },
      { name: "Ground-Glass Stopper / Parafilm", spec: "Airtight seal to prevent escape of volatile I₂ fumes" },
      { name: "Light-Tight Dark Cupboard", spec: "Dark reaction dwell chamber (10 minutes dwell)" }
    ],
    6: [
      { name: "Class-A 50 mL Glass Burette", spec: "0.05 mL graduations, Schellbach stripe, PTFE stopcock" },
      { name: "Heavy Retort Stand & Double Clamp", spec: "Cast-iron base with chemical-resistant enamel coating" },
      { name: "White Ceramic Contrast Tile", spec: "Glazed white porcelain tile for sharp endpoint detection" },
      { name: "Magnetic Stirrer & PTFE Stir Bar", spec: "Variable speed motor with 25 mm octagonal Teflon bar" },
      { name: "Standard Sodium Thiosulfate", spec: "0.1000 mol/L (0.1 N) Na₂S₂O₃ standardized against KIO₃" }
    ],
    7: [
      { name: "Fresh Starch Indicator Solution", spec: "1.0% (m/v) soluble starch in water, 2 mL aliquot" },
      { name: "Precision Drop Dispenser", spec: "Calibrated 0.05 mL drop volume" },
      { name: "LED Daylight Background Illumination", spec: "Neutral 5000–6500 K color rendering for endpoint" }
    ],
    8: [
      { name: "Stoichiometric Calculation Engine", spec: "ISO 5398-1:2007 (E) Formula with moisture correction" },
      { name: "Footwear Performance Standards Database", spec: "ISO 20344 / IS 582 / SATRA guidelines for shoe leathers" },
      { name: "Laboratory Calibration Report Generator", spec: "Formal Certificate of Analysis with ISO traceability" }
    ]
  }
};

