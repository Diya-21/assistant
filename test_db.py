from backend.db_manager import init_db, add_user, get_user, store_history, get_history
import os

def test():
    # Ensure DB is initialized
    init_db()
    
    # Test user
    roll = "TEST001"
    add_user("Test User", roll)
    user = get_user(roll)
    print(f"User found: {user['name'] if user else 'None'}")
    
    # Test history
    store_history(roll, "search", "What is AI?", "AI is...")
    history = get_history(roll)
    print(f"History count: {len(history)}")
    for h in history:
        print(f"- {h['type']}: {h['query']}")

if __name__ == "__main__":
    test()
