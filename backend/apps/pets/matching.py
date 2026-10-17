"""
PawMatch: Rule-based pet matching algorithm for PawConnect.
No external AI or ML dependencies required — clean, deterministic, and college-evaluation friendly.
"""

def categorize_age(age_years):
    """Categorize numeric pet age in years into an age group."""
    try:
        val = float(age_years)
    except (ValueError, TypeError):
        return "adult"
    
    if val < 1.0:
        return "baby"      # Puppy / Kitten
    elif val <= 3.0:
        return "young"
    elif val <= 8.0:
        return "adult"
    else:
        return "senior"

def match_pet(pet, preferences):
    """
    Evaluate compatibility between a pet and user preferences.
    Returns:
        score (int 0-100),
        reasons (list of strings),
        matched (bool)
    """
    score = 0
    max_possible = 100
    reasons = []

    pref_species = preferences.get('species', '').strip().lower()
    pref_size = preferences.get('size', '').strip().lower()
    pref_activity = preferences.get('activity_level', '').strip().lower()
    pref_age_group = preferences.get('age_group', '').strip().lower()
    pref_living_space = preferences.get('living_space', '').strip().lower()
    has_children = bool(preferences.get('has_children', False))
    has_other_pets = bool(preferences.get('has_other_pets', False))

    pet_species = str(pet.get('species', '')).strip().lower()
    pet_size = str(pet.get('size', 'medium')).strip().lower()
    pet_activity = str(pet.get('activity_level', 'moderate')).strip().lower()
    pet_age_years = pet.get('age', 2)
    pet_age_group = categorize_age(pet_age_years)
    pet_good_with_kids = bool(pet.get('good_with_kids', True))
    pet_good_with_pets = bool(pet.get('good_with_pets', True))

    # 1. Species Match (30 pts)
    if not pref_species or pref_species == 'any':
        score += 30
        reasons.append("Open to all species")
    elif pref_species == pet_species:
        score += 30
        reasons.append(f"Direct match for preferred species ({pet_species.title()})")
    else:
        # Different species, heavy penalty
        score += 0

    # 2. Size Match (20 pts)
    if not pref_size or pref_size == 'any':
        score += 20
    elif pref_size == pet_size:
        score += 20
        reasons.append(f"Ideal {pet_size.title()} size for your preference")
    elif (pref_size == 'small' and pet_size == 'medium') or (pref_size == 'large' and pet_size == 'medium'):
        score += 10
        reasons.append("Close size match")

    # 3. Activity Level Match (20 pts)
    if not pref_activity or pref_activity == 'any':
        score += 20
    elif pref_activity == pet_activity:
        score += 20
        reasons.append(f"Matches your desired {pet_activity.title()} activity lifestyle")
    elif (pref_activity == 'moderate' and pet_activity in ['low', 'high']):
        score += 10
        reasons.append("Adaptable energy level")

    # 4. Age Group Match (15 pts)
    if not pref_age_group or pref_age_group == 'any':
        score += 15
    elif pref_age_group == pet_age_group:
        score += 15
        reasons.append(f"Matches desired age stage ({pet_age_group.title()})")
    else:
        score += 5

    # 5. Living Space Compatibility (15 pts)
    if pref_living_space == 'apartment':
        if pet_size in ['small', 'medium'] and pet_activity in ['low', 'moderate']:
            score += 15
            reasons.append("Well-suited for apartment living")
        elif pet_size == 'small':
            score += 10
            reasons.append("Manageable apartment size")
        else:
            score += 5
    elif pref_living_space in ['house_yard', 'large_yard', 'house']:
        score += 15
        reasons.append("Great fit for a home with yard space")
    else:
        score += 15

    # 6. Household Compatibility Checks
    if has_children:
        if pet_good_with_kids:
            reasons.append("Friendly and verified safe around kids")
        else:
            score = max(0, score - 20)
            reasons.append("Caution: Prefers an adults-only home")

    if has_other_pets:
        if pet_good_with_pets:
            reasons.append("Sociable with other domestic pets")
        else:
            score = max(0, score - 15)
            reasons.append("Caution: Best as the only pet in the home")

    # Health & Vaccinated bonus point
    if pet.get('vaccinated'):
        reasons.append("Fully vaccinated and health-checked")

    # Bound score between 10 and 100
    final_score = min(100, max(15, score))

    return {
        "score": final_score,
        "reasons": reasons,
        "match_percentage": f"{final_score}%",
    }
