import os
import uuid
from datetime import datetime, timezone

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    firebase_admin = None
    firestore = None


class MockDocSnapshot:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return dict(self._data) if self._data is not None else None


class MockDocRef:
    def __init__(self, collection, doc_id):
        self._collection = collection
        self.id = doc_id

    def get(self):
        data = self._collection._docs.get(self.id)
        return MockDocSnapshot(self.id, data)

    def set(self, data, merge=False):
        if merge and self.id in self._collection._docs:
            merged = dict(self._collection._docs[self.id])
            merged.update(data)
            self._collection._docs[self.id] = merged
        else:
            self._collection._docs[self.id] = dict(data)
        return self

    def update(self, data):
        if self.id in self._collection._docs:
            self._collection._docs[self.id].update(data)


class MockQuery:
    def __init__(self, collection, filters=None, order_field=None, order_desc=False, limit_count=None):
        self._collection = collection
        self._filters = filters or []
        self._order_field = order_field
        self._order_desc = order_desc
        self._limit_count = limit_count

    def where(self, field, op, val):
        new_filters = list(self._filters)
        new_filters.append((field, op, val))
        return MockQuery(self._collection, new_filters, self._order_field, self._order_desc, self._limit_count)

    def order_by(self, field, direction=None):
        desc = (direction == "DESCENDING" or (firestore and direction == getattr(firestore.Query, "DESCENDING", "DESCENDING")))
        return MockQuery(self._collection, self._filters, field, desc, self._limit_count)

    def limit(self, count):
        return MockQuery(self._collection, self._filters, self._order_field, self._order_desc, count)

    def _execute(self):
        results = []
        for doc_id, doc in self._collection._docs.items():
            matches = True
            for field, op, val in self._filters:
                doc_val = doc.get(field)
                if op == "==" and doc_val != val:
                    matches = False
                    break
                elif op == "!=" and doc_val == val:
                    matches = False
                    break
            if matches:
                results.append((doc_id, doc))

        if self._order_field:
            def sort_key(item):
                val = item[1].get(self._order_field)
                if val is None:
                    return "" if not self._order_desc else "\uffff"
                return str(val)
            results.sort(key=sort_key, reverse=self._order_desc)

        if self._limit_count is not None:
            results = results[:self._limit_count]

        return [MockDocSnapshot(doc_id, data) for doc_id, data in results]

    def get(self):
        return self._execute()

    def stream(self):
        return iter(self._execute())


class MockCollection(MockQuery):
    def __init__(self, name):
        self.name = name
        self._docs = {}
        super().__init__(self)

    def document(self, doc_id=None):
        if not doc_id:
            doc_id = str(uuid.uuid4())
        return MockDocRef(self, str(doc_id))

    def add(self, data):
        doc_id = str(uuid.uuid4())
        self._docs[doc_id] = dict(data)
        return (datetime.now(timezone.utc), MockDocRef(self, doc_id))


class MockFirestoreClient:
    def __init__(self):
        self._collections = {}
        self._seed_data()

    def collection(self, name):
        if name not in self._collections:
            self._collections[name] = MockCollection(name)
        return self._collections[name]

    def _seed_data(self):
        # Seed sample ASHA workers for testing nearest locator and login
        workers = self.collection("asha_workers")
        workers.document("KA123456").set({
            "full_name": "Sunitha Gowda",
            "nhm_id": "KA123456",
            "phone": "9876543210",
            "village": "Koramangala, Bengaluru",
            "language": "KN",
            "status": "active",
            "location": {"lat": 12.9352, "lng": 77.6245},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        workers.document("KA654321").set({
            "full_name": "Lakshmi Devi",
            "nhm_id": "KA654321",
            "phone": "9876543211",
            "village": "Shivajinagar, Bengaluru",
            "language": "KN",
            "status": "active",
            "location": {"lat": 12.9857, "lng": 77.6057},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        workers.document("KA789012").set({
            "full_name": "Manjula R",
            "nhm_id": "KA789012",
            "phone": "9876543212",
            "village": "Jayanagar, Bengaluru",
            "language": "KN",
            "status": "active",
            "location": {"lat": 12.9250, "lng": 77.5938},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        # Seed sample NSQ medicines
        nsq = self.collection("nsq_medicines")
        nsq.document("nsq-1").set({
            "batch_number": "CDSCO-NSQ-001",
            "drug_name": "Paracetamol 500mg",
            "reason": "Substandard dissolution test failure",
        })
        nsq.document("nsq-2").set({
            "batch_number": "FAKE1234",
            "drug_name": "Amoxicillin Trihydrate 500mg",
            "reason": "Counterfeit batch reported by CDSCO",
        })


_global_db_instance = None
_is_mock_instance = False


def init_db(key_path_setting):
    global _global_db_instance, _is_mock_instance
    if _global_db_instance is not None:
        return _global_db_instance, _is_mock_instance

    key_path = os.path.abspath(key_path_setting) if not os.path.isabs(key_path_setting) else key_path_setting
    if not os.path.exists(key_path):
        alt_path = os.path.join(os.path.dirname(__file__), key_path_setting)
        if os.path.exists(alt_path):
            key_path = alt_path

    if os.path.exists(key_path) and os.path.isfile(key_path) and firebase_admin:
        try:
            if not firebase_admin._apps:
                cred = credentials.Certificate(key_path)
                firebase_admin.initialize_app(cred)
            _global_db_instance = firestore.client()
            _is_mock_instance = False
            print(f"[Firebase] Successfully connected to Firestore using {key_path}")
            return _global_db_instance, _is_mock_instance
        except Exception as e:
            print(f"[Firebase] Warning: Failed to initialize Firebase with {key_path}: {e}")

    print(f"[Firebase] Key file not found or invalid at '{key_path_setting}'. Using local mock Firestore store.")
    _global_db_instance = MockFirestoreClient()
    _is_mock_instance = True
    return _global_db_instance, _is_mock_instance
