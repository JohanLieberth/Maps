from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Process(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    area = db.Column(db.String(100))
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='Active')
    cost_per_hour = db.Column(db.Float, default=0.0)  # For ROI calculations
    steps = db.relationship('Step', backref='process', cascade="all, delete-orphan", lazy=True)

class Step(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    process_id = db.Column(db.Integer, db.ForeignKey('process.id'), nullable=False)
    order = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    cycle_time = db.Column(db.Float, default=0.0)  # Work time
    wait_time = db.Column(db.Float, default=0.0)   # Time between steps
    value_type = db.Column(db.String(20))          # VA, NVA, NNVA
    quality_pct = db.Column(db.Float, default=100.0) # % of quality (defects)

    # For simplification analysis
    simplify = db.Column(db.Boolean, default=False)
    new_time = db.Column(db.Float)
    improvement_type = db.Column(db.String(50))    # Eliminate, Automate, Delegate, Reduce
    impact = db.Column(db.Integer, default=5)      # 1-10
    effort = db.Column(db.Integer, default=5)      # 1-10

class Activity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    process_id = db.Column(db.Integer, db.ForeignKey('process.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    raci_assignments = db.relationship('RACIAssignment', backref='activity', cascade="all, delete-orphan", lazy=True)

class RACIAssignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    person_role = db.Column(db.String(100), nullable=False)
    role_r = db.Column(db.Boolean, default=False)
    role_a = db.Column(db.Boolean, default=False)
    role_c = db.Column(db.Boolean, default=False)
    role_i = db.Column(db.Boolean, default=False)
