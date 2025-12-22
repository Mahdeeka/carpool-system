# Comprehensive Improvements Plan

## Issues Identified:
1. **My Rides showing nothing** - Data persistence + proper fetching
2. **White text not visible** - Contrast issues
3. **Gender checkboxes not visible** - Styling problems  
4. **Payment info not visible** - Already in code but colors need improvement
5. **No "My Requests" section** - Track join requests  
6. **Need passenger count field** - Allow multiple passengers per request
7. **UI terminology** - "Request" → "Requested to Join"

## Solutions:

### 1. Fix Text Visibility & Colors
- Update all white text on light backgrounds to dark colors
- Improve payment badges contrast
- Fix gender radio button styling

### 2. Add Passenger Count Field
- When joining a ride, allow user to specify number of passengers (1-remaining seats)
- Update backend to store passenger_count

### 3. Create "My Requests" Tab
- Add new tab in My Rides for join requests sent
- Show status: pending/confirmed/rejected

### 4. Improve Data Persistence
- Better localStorage usage for tracking
- Clear API responses

### 5. Better UI/UX
- Change terminology throughout
- Add visual indicators
- Improve mobile responsiveness





