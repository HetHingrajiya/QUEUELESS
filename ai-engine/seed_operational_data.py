import sys
import os
import random
from datetime import datetime, timedelta
from bson import ObjectId

sys.path.append(os.path.dirname(__file__))
from database import get_sync_db

def seed_operational_history():
    db = get_sync_db()
    print("Seeding realistic historical operational data for QueueLess...")

    offices = list(db.offices.find({"name": {"$in": ["Office 1", "Office 2", "Office 3"]}}))
    if not offices:
        offices = list(db.offices.find({}).limit(3))
    
    if not offices:
        print("No offices found!")
        return

    services = list(db.services.find({"officeId": {"$in": [o["_id"] for o in offices]}}))
    if not services:
        services = list(db.services.find({}).limit(5))

    citizens = list(db.users.find({"role": "CITIZEN"}).limit(5))
    citizen_ids = [c["_id"] for c in citizens] if citizens else [ObjectId()]

    print(f"Found {len(offices)} offices, {len(services)} services, {len(citizen_ids)} citizens.")

    new_tokens = []
    new_events = []

    # Generate 60 completed operational tokens across past 14 days
    now = datetime.utcnow()
    
    for i in range(60):
        service = random.choice(services)
        office_id = service.get("officeId", offices[0]["_id"])
        citizen_id = random.choice(citizen_ids)

        days_ago = random.randint(1, 14)
        hour = random.choice([9, 10, 11, 12, 13, 14, 15, 16, 17])
        minute = random.randint(0, 50)
        
        created_at = (now - timedelta(days=days_ago)).replace(hour=hour, minute=minute, second=random.randint(0, 59), microsecond=0)
        
        # Real queue conditions at that time
        people_ahead = random.randint(0, 8)
        queue_position = people_ahead + 1
        avg_svc_time = float(service.get("averageServiceTime", 10.0))
        
        # Realistic wait time influenced by people ahead, counters (1-2), slight variance
        active_counters = random.choice([1, 2])
        base_wait = (people_ahead * avg_svc_time) / active_counters
        noise = random.uniform(-2.5, 3.5)
        actual_wait_mins = max(1.5, base_wait + noise)
        
        called_at = created_at + timedelta(minutes=actual_wait_mins)
        # Check in 1-2 mins after being called
        checked_in_at = called_at + timedelta(minutes=random.uniform(0.5, 1.5))
        # Service starts shortly after check in
        service_started_at = checked_in_at + timedelta(minutes=random.uniform(0.2, 1.0))
        # Service duration with natural variation around avg_svc_time
        actual_svc_duration = max(3.0, avg_svc_time + random.uniform(-2.0, 4.0))
        completed_at = service_started_at + timedelta(minutes=actual_svc_duration)

        priority = "VIP" if random.random() < 0.15 else "NORMAL"
        priority_score = 1 if priority == "VIP" else 0

        token_id = ObjectId()
        token_num = f"HIST-{office_id.binary[:2].hex().upper()}-{100 + i}"

        token_doc = {
            "_id": token_id,
            "tokenNumber": token_num,
            "citizenId": citizen_id,
            "officeId": office_id,
            "serviceId": service["_id"],
            "status": "COMPLETED",
            "position": queue_position,
            "priority": priority,
            "priorityScore": priority_score,
            "calledAt": called_at,
            "startTime": service_started_at,
            "completionTime": completed_at,
            "createdAt": created_at,
            "updatedAt": completed_at,
            "isHistoricalSeed": True
        }
        new_tokens.append(token_doc)

        # Lifecycle QueueEvents
        # 1. TOKEN_CREATED
        new_events.append({
            "tokenId": token_id,
            "officeId": office_id,
            "serviceId": service["_id"],
            "status": "CREATED",
            "eventType": "TOKEN_CREATED",
            "createdAt": created_at,
            "updatedAt": created_at
        })
        # 2. CALLED
        new_events.append({
            "tokenId": token_id,
            "officeId": office_id,
            "serviceId": service["_id"],
            "status": "CALLED",
            "eventType": "CALLED",
            "createdAt": called_at,
            "updatedAt": called_at
        })
        # 3. CHECKED_IN
        new_events.append({
            "tokenId": token_id,
            "officeId": office_id,
            "serviceId": service["_id"],
            "status": "CHECKED_IN",
            "eventType": "CHECKED_IN",
            "createdAt": checked_in_at,
            "updatedAt": checked_in_at
        })
        # 4. SERVICE_STARTED
        new_events.append({
            "tokenId": token_id,
            "officeId": office_id,
            "serviceId": service["_id"],
            "status": "SERVING",
            "eventType": "SERVICE_STARTED",
            "createdAt": service_started_at,
            "updatedAt": service_started_at
        })
        # 5. SERVICE_COMPLETED
        new_events.append({
            "tokenId": token_id,
            "officeId": office_id,
            "serviceId": service["_id"],
            "status": "COMPLETED",
            "eventType": "SERVICE_COMPLETED",
            "createdAt": completed_at,
            "updatedAt": completed_at
        })

    # Clean old historical seeds if any
    db.tokens.delete_many({"isHistoricalSeed": True})
    token_ids_seeded = [t["_id"] for t in new_tokens]
    db.queueevents.delete_many({"tokenId": {"$in": token_ids_seeded}})

    db.tokens.insert_many(new_tokens)
    db.queueevents.insert_many(new_events)

    print(f"Successfully seeded {len(new_tokens)} completed tokens and {len(new_events)} queue events into MongoDB.")

if __name__ == "__main__":
    seed_operational_history()
