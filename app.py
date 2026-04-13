import os
import io
import pandas as pd
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file
from models import db, Process, Step, Activity, RACIAssignment
from flask_migrate import Migrate
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bpm_system.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-key-bpm'

db.init_app(app)
migrate = Migrate(app, db)

@app.route('/')
def index():
    processes = Process.query.all()
    return render_template('index.html', processes=processes)

@app.route('/process/create', methods=['POST'])
def create_process():
    name = request.form.get('name')
    area = request.form.get('area')
    cost_per_hour = float(request.form.get('cost_per_hour', 0))
    if name:
        new_process = Process(name=name, area=area, cost_per_hour=cost_per_hour)
        db.session.add(new_process)
        db.session.commit()
    return redirect(url_for('index'))

@app.route('/process/<int:process_id>')
def view_process(process_id):
    process = Process.query.get_or_404(process_id)
    steps = Step.query.filter_by(process_id=process_id).order_by(Step.order).all()

    # VSM Calculations
    total_cycle_time = sum(s.cycle_time for s in steps)
    total_wait_time = sum(s.wait_time for s in steps)
    lead_time = total_cycle_time + total_wait_time

    va_time = sum(s.cycle_time for s in steps if s.value_type == 'VA')
    nva_time = sum(s.cycle_time for s in steps if s.value_type == 'NVA')
    nnva_time = sum(s.cycle_time for s in steps if s.value_type == 'NNVA')

    efficiency = (va_time / lead_time * 100) if lead_time > 0 else 0

    return render_template('process_detail.html',
                           process=process,
                           steps=steps,
                           total_cycle_time=total_cycle_time,
                           total_wait_time=total_wait_time,
                           lead_time=lead_time,
                           va_time=va_time,
                           nva_time=nva_time,
                           nnva_time=nnva_time,
                           efficiency=efficiency)

@app.route('/process/<int:process_id>/step/add', methods=['POST'])
def add_step(process_id):
    name = request.form.get('name')
    cycle_time = float(request.form.get('cycle_time', 0))
    wait_time = float(request.form.get('wait_time', 0))
    value_type = request.form.get('value_type')
    quality_pct = float(request.form.get('quality_pct', 100))

    last_step = Step.query.filter_by(process_id=process_id).order_by(Step.order.desc()).first()
    order = (last_step.order + 1) if last_step else 1

    new_step = Step(process_id=process_id, name=name, cycle_time=cycle_time,
                    wait_time=wait_time, value_type=value_type, quality_pct=quality_pct, order=order)
    db.session.add(new_step)
    db.session.commit()
    return redirect(url_for('view_process', process_id=process_id))

@app.route('/process/<int:process_id>/simplification')
def simplification_analysis(process_id):
    process = Process.query.get_or_404(process_id)
    steps = Step.query.filter_by(process_id=process_id).order_by(Step.order).all()

    current_total_time = sum(s.cycle_time for s in steps)

    potential_savings = 0
    improved_steps = []

    for s in steps:
        if s.simplify and s.new_time is not None:
            potential_savings += (s.cycle_time - s.new_time)
            improved_steps.append(s)

    reduction_pct = (potential_savings / current_total_time * 100) if current_total_time > 0 else 0
    roi_estimado = (potential_savings / 60.0) * process.cost_per_hour # Assuming minutes

    return render_template('simplification.html',
                           process=process,
                           steps=steps,
                           potential_savings=potential_savings,
                           reduction_pct=reduction_pct,
                           roi_estimado=roi_estimado)

@app.route('/step/<int:step_id>/simplify', methods=['POST'])
def update_simplification(step_id):
    step = Step.query.get_or_404(step_id)
    step.simplify = request.form.get('simplify') == 'true'
    step.new_time = float(request.form.get('new_time', step.cycle_time))
    step.improvement_type = request.form.get('improvement_type')
    step.impact = int(request.form.get('impact', 5))
    step.effort = int(request.form.get('effort', 5))
    db.session.commit()
    return redirect(url_for('simplification_analysis', process_id=step.process_id))

@app.route('/process/<int:process_id>/activity/add', methods=['POST'])
def add_activity(process_id):
    name = request.form.get('name')
    if name:
        new_activity = Activity(process_id=process_id, name=name)
        db.session.add(new_activity)
        db.session.commit()
    return redirect(url_for('raci_matrix', process_id=process_id))

@app.route('/activity/<int:activity_id>/assign', methods=['POST'])
def assign_raci(activity_id):
    activity = Activity.query.get_or_404(activity_id)
    person_role = request.form.get('person_role')
    r = 'R' in request.form.getlist('roles')
    a = 'A' in request.form.getlist('roles')
    c = 'C' in request.form.getlist('roles')
    i = 'I' in request.form.getlist('roles')

    # Validation: Only one A per activity
    if a:
        existing_a = RACIAssignment.query.filter_by(activity_id=activity_id, role_a=True).first()
        if existing_a and existing_a.person_role != person_role:
             flash('Solo puede haber un "A" (Accountable) por actividad.', 'danger')
             return redirect(url_for('raci_matrix', process_id=activity.process_id))

    assignment = RACIAssignment.query.filter_by(activity_id=activity_id, person_role=person_role).first()
    if not assignment:
        assignment = RACIAssignment(activity_id=activity_id, person_role=person_role)
        db.session.add(assignment)

    assignment.role_r = r
    assignment.role_a = a
    assignment.role_c = c
    assignment.role_i = i

    db.session.commit()
    return redirect(url_for('raci_matrix', process_id=activity.process_id))

@app.route('/process/<int:process_id>/export/excel')
def export_excel(process_id):
    process = Process.query.get_or_404(process_id)
    steps = Step.query.filter_by(process_id=process_id).order_by(Step.order).all()

    data = []
    for s in steps:
        data.append({
            'Orden': s.order,
            'Nombre': s.name,
            'Tiempo Ciclo': s.cycle_time,
            'Tiempo Espera': s.wait_time,
            'Tipo Valor': s.value_type,
            'Calidad %': s.quality_pct
        })

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='VSM')

    output.seek(0)
    return send_file(output, download_name=f'VSM_{process.name}.xlsx', as_attachment=True)

@app.route('/process/<int:process_id>/export/pdf')
def export_pdf(process_id):
    process = Process.query.get_or_404(process_id)
    steps = Step.query.filter_by(process_id=process_id).order_by(Step.order).all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()

    elements.append(Paragraph(f"Reporte de Mapa de Valor: {process.name}", styles['Title']))
    elements.append(Paragraph(f"Area: {process.area}", styles['Normal']))

    data = [['#', 'Nombre', 'T. Ciclo', 'T. Espera', 'Tipo', 'Calidad']]
    for s in steps:
        data.append([s.order, s.name, s.cycle_time, s.wait_time, s.value_type, f"{s.quality_pct}%"])

    t = Table(data)
    t.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                           ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                           ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                           ('GRID', (0, 0), (-1, -1), 1, colors.black)]))
    elements.append(t)
    doc.build(elements)
    buffer.seek(0)
    return send_file(buffer, download_name=f'VSM_{process.name}.pdf', as_attachment=True)

@app.route('/process/<int:process_id>/raci/export/excel')
def export_raci_excel(process_id):
    process = Process.query.get_or_404(process_id)
    activities = Activity.query.filter_by(process_id=process_id).all()
    roles_query = db.session.query(RACIAssignment.person_role).join(Activity).filter(Activity.process_id == process_id).distinct().all()
    roles = [r[0] for r in roles_query]

    data = []
    for activity in activities:
        row = {'Actividad': activity.name}
        for role in roles:
            ass = RACIAssignment.query.filter_by(activity_id=activity.id, person_role=role).first()
            val = []
            if ass:
                if ass.role_r: val.append('R')
                if ass.role_a: val.append('A')
                if ass.role_c: val.append('C')
                if ass.role_i: val.append('I')
            row[role] = ', '.join(val)
        data.append(row)

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='RACI')

    output.seek(0)
    return send_file(output, download_name=f'RACI_{process.name}.xlsx', as_attachment=True)

@app.route('/process/<int:process_id>/raci')
def raci_matrix(process_id):
    process = Process.query.get_or_404(process_id)
    activities = Activity.query.filter_by(process_id=process_id).all()

    roles_query = db.session.query(RACIAssignment.person_role).join(Activity).filter(Activity.process_id == process_id).distinct().all()
    roles = [r[0] for r in roles_query]

    matrix = {}
    validations = {}
    for activity in activities:
        matrix[activity.id] = {role: '' for role in roles}
        assignments = RACIAssignment.query.filter_by(activity_id=activity.id).all()

        has_r = False
        has_a = False
        for ass in assignments:
            val = []
            if ass.role_r:
                val.append('R')
                has_r = True
            if ass.role_a:
                val.append('A')
                has_a = True
            if ass.role_c: val.append('C')
            if ass.role_i: val.append('I')
            matrix[activity.id][ass.person_role] = ', '.join(val)

        validations[activity.id] = {'has_r': has_r, 'has_a': has_a}

    return render_template('raci.html', process=process, activities=activities, roles=roles, matrix=matrix, validations=validations)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
