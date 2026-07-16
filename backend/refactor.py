import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'db.users' not in content:
        return

    # Add get_auth_db to imports
    content = re.sub(r'from database import .*?get_db.*?', lambda m: m.group(0).replace('get_db', 'get_db, get_auth_db') if 'get_auth_db' not in m.group(0) else m.group(0), content)
    if 'get_auth_db' not in content and 'from database import' in content:
        pass # Handle manually if needed

    # If it's a router file, update route signatures to include auth_db=Depends(get_auth_db)
    if 'routers' in filepath:
        # Match async def function(..., db=Depends(get_db), ...)
        content = re.sub(
            r'(async def \w+\(.*?)db=Depends\(get_db\)(.*?\):)',
            r'\1db=Depends(get_db), auth_db=Depends(get_auth_db)\2',
            content
        )

    # In main.py or scripts, we might just need to import auth_db
    if 'main.py' in filepath or 'create_' in filepath or 'set_' in filepath:
        content = re.sub(r'from database import (.*?db.*?)', r'from database import \1, auth_db', content)
        content = content.replace(', auth_db, auth_db', ', auth_db')

    # Replace db.users with auth_db.users globally
    content = content.replace('db.users', 'auth_db.users')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Refactored {filepath}")

for root, _, files in os.walk('.'):
    for f in files:
        if f.endswith('.py') and f != 'refactor.py' and 'database.py' not in f and 'auth.py' not in f:
            process_file(os.path.join(root, f))
