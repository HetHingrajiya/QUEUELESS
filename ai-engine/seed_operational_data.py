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

    # Ensure Office 3 has an active counter if missing
    for off in offices:
        existing_c = db.counters.find_one({"officeId": off["_id"], "status": "ACTIVE"})
        if not existing_c:
            new_counter = {
                "number": "1",
                "name": f"Counter 1 - {off.get('name', 'Office')}",
                "officeId": off["_id"],
                "status": "ACTIVE",
                "serviceIds": [],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            db.counters.insert_one(new_counter)
            print(f"Created active counter for office {off.get('name')}")

    # Map real active counters per office
    active_counters_map = {}
    for off in offices:
        cnt = db.counters.count_documents({"officeId": off["_id"], "status": "ACTIVE"})
        active_counters_map[str(off["_id"])] = max(1, cnt)

    print(f"Active counters map: {active_counters_map}")

    services = list(db.services.find({"officeId": {"$in": [o["_id"] for o in offices]}}))
    if not services:
        services = list(db.services.find({}).limit(5))

    citizens = list(db.users.find({"role": "CITIZEN"}).limit(5))
    citizen_ids = [c["_id"] for c in citizens] if citizens else [ObjectId()]

    print(f"Found {len(offices)} offices, {len(services)} services, {len(citizen_ids)} citizens.")

    new_tokens = []
    new_events = []

    # Generate 160 completed operational tokens across past 21 days
    now = datetime.utcnow()
    random.seed(42) # Deterministic seed for reproducible evaluation
    
    for i in range(160):
        service = random.choice(services)
        office_id = service.get("officeId", offices[0]["_id"])
        citizen_id = random.choice(citizen_ids)

        days_ago = random.randint(1, 21)
        hour = random.choice([9, 10, 11, 12, 13, 14, 15, 16, 17])
        minute = random.randint(0, 50)
        
        created_at = (now - timedelta(days=days_ago)).replace(hour=hour, minute=minute, second=random.randint(0, 59), microsecond=0)
        day_of_week = created_at.weekday()

        # Real queue conditions at that time
        people_ahead = random.randint(0, 10)
        queue_position = people_ahead + 1
        avg_svc_time = float(service.get("averageServiceTime", 10.0))
        active_counters = active_counters_map.get(str(office_id), 1)

        # Realistic government operational dynamics:
        # 1. Base queuing ratio
        raw_wait = (people_ahead * avg_svc_time) / active_counters

        # 2. Peak hour congestion (11:00 - 14:00 has staff lunch rotation & higher case complexity)
        peak_factor = 1.25 if (11 <= hour <= 14) else 1.0

        # 3. Priority routing: VIP / Senior Citizens get priority counter dispatch (~40% reduced wait)
        is_vip = random.random() < 0.18
        priority = "VIP" if is_vip else "NORMAL"
        priority_score = 1 if is_vip else 0
        priority_factor = 0.60 if is_vip else 1.0

        # 4. Day of week effect (Mondays have initial weekly backlog)
        day_factor = 1.12 if day_of_week == 0 else 1.0

        # 5. Natural small operational variance
        noise = random.uniform(-1.2, 1.2)
        actual_wait_mins = max(1.0, (raw_wait * peak_factor * priority_factor * day_factor) + noise)
        
        called_at = created_at + timedelta(minutes=actual_wait_mins)
        # Check in 1-2 mins after being called
        checked_in_at = called_at + timedelta(minutes=random.uniform(0.5, 1.5))
        # Service starts shortly after check in
        service_started_at = checked_in_at + timedelta(minutes=random.uniform(0.2, 0.8))
        # Service duration with natural variation around avg_svc_time
        actual_svc_duration = max(3.0, avg_svc_time + random.uniform(-1.5, 2.5))
        completed_at = service_started_at + timedelta(minutes=actual_svc_duration)

        token_id = ObjectId()
        token_num = f"HIST-{office_id.binary[:2].hex().upper()}-{100 + i}"

        token_doc = {
            "_id": token_id,
            "tokenNumber": token_num,
            "citizenId": citizen_id,
            "officeId": office_id,
            "serviceId": service["_id"],
            "status": "COMPLETED",
            "queuePosition": queue_position,
            "position": queue_position,
            "priority": priority,
            "priorityScore": priority_score,
            "callTime": called_at,
            "calledAt": called_at,
            "startTime": service_started_at,
            "completionTime": completed_at,
            "activeCounters": active_counters,
            "createdAt": created_at,
            "updatedAt": completed_at,
            "isHistoricalSeed": True
        }
        new_tokens.append(token_doc)

        # Lifecycle QueueEvents
        new_events.append({
            "tokenId": token_id,
            "officeId": office_id,
            "serviceId": service["_id"],
            "status": "CREATED",
            "eventType": "TOKEN_CREATED",
            "createdAt": created_at,
            "updatedAt": created_at
        })
        new_events.append({
            "tokenId": token_id,
            "officeId": office_id,
            "serviceId": service["_id"],
            "status": "CALLED",
            "eventType": "CALLED",
            "createdAt": called_at,
            "updatedAt": called_at
        })
        new_events.append({
            "tokenId": token_id,
            "officeId": office_id,
            "serviceId": service["_id"],
            "status": "CHECKED_IN",
            "eventType": "CHECKED_IN",
            "createdAt": checked_in_at,
            "updatedAt": checked_in_at
        })
        new_events.append({
            "tokenId": token_id,
            "officeId": office_id,
            "serviceId": service["_id"],
            "status": "SERVING",
            "eventType": "SERVICE_STARTED",
            "createdAt": service_started_at,
            "updatedAt": service_started_at
        })
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
