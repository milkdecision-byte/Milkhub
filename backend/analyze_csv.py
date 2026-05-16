import csv
import collections

csv_data = """farmer_name,farmer_id,date,shift,fat,snf,ph,acidity,temperature,specific_gravity,cob_test,alcohol_test,organoleptic,sediment_test,mbrt,raw_milk_temp,quantity
Ravi,F001,5/6/2026,Morning,3.3,8.4,6.6,0.12,9,1.03,Negative,Negative,Normal,Clean,4.1,30,25
Mani,F002,5/6/2026,Evening,2.9,8.4,6.6,0.12,9,1.03,Negative,Negative,Normal,Clean,4,31,20
Suresh,F003,5/6/2026,Morning,3.4,8.1,6.6,0.12,9,1.03,Negative,Negative,Normal,Clean,4.2,29,22
Kumar,F004,5/6/2026,Evening,3.3,8.4,6.3,0.12,9,1.03,Negative,Negative,Normal,Clean,4,32,19
Arun,F005,5/6/2026,Morning,3.3,8.4,6.6,0.18,9,1.03,Negative,Negative,Normal,Clean,4,30,26
Bala,F006,5/6/2026,Evening,3.3,8.4,6.6,0.12,16,1.03,Negative,Negative,Normal,Clean,4,30,23
Vijay,F007,5/6/2026,Morning,3.3,8.4,6.6,0.12,9,1.025,Negative,Negative,Normal,Clean,4,31,24
Ajay,F008,5/6/2026,Evening,3.3,8.4,6.6,0.12,9,1.03,Positive,Negative,Normal,Clean,4,30,25
Dinesh,F009,5/6/2026,Morning,3.3,8.4,6.6,0.12,9,1.03,Negative,Positive,Normal,Clean,4,30,20
Hari,F010,5/6/2026,Evening,3.3,8.4,6.6,0.12,9,1.03,Negative,Negative,Abnormal,Clean,4,30,18
Naren,F011,5/6/2026,Morning,3.3,8.4,6.6,0.12,9,1.03,Negative,Negative,Normal,Dirty,4,30,17
Prabhu,F012,5/6/2026,Evening,3.3,8.4,6.6,0.12,9,1.03,Negative,Negative,Normal,Clean,1.8,30,19
Karthi,F013,5/6/2026,Morning,3.3,8.4,6.6,0.12,12,1.03,Negative,Negative,Normal,Clean,2.5,30,25
Mohan,F014,5/6/2026,Evening,3.5,8.5,6.8,0.15,10,1.032,Negative,Negative,Normal,Clean,3.5,37,21
Ramesh,F015,5/6/2026,Morning,3.2,8.3,6.5,0.1,10,1.028,Negative,Negative,Normal,Clean,3.1,25,20
Selva,F016,5/6/2026,Evening,3.6,8.6,6.9,0.16,14,1.033,Negative,Negative,Normal,Clean,2.7,36,24
Ganesh,F017,5/6/2026,Morning,3.1,8.2,6.4,0.11,9,1.029,Negative,Negative,Normal,Clean,3.8,29,22
Lokesh,F018,5/6/2026,Evening,3.4,8.4,6.7,0.13,8,1.031,Negative,Negative,Normal,Clean,4.3,30,23
Deepak,F019,5/6/2026,Morning,3.3,8.4,6.6,0.12,11,1.03,Negative,Negative,Normal,Clean,2.2,30,25
Vinoth,F020,5/6/2026,Evening,3,8,6.2,0.18,17,1.024,Positive,Positive,Abnormal,Dirty,1.5,40,15
Anbu,F021,5/6/2026,Morning,3.3,8.4,6.6,0.12,9,1.03,Negative,Negative,Normal,Clean,4,31,22
Arivu,F022,5/6/2026,Evening,3.4,8.5,6.7,0.12,9,1.031,Negative,Negative,Normal,Clean,4.2,30,24
Boopathi,F023,5/6/2026,Morning,3.1,8.4,6.6,0.12,9,1.03,Negative,Negative,Normal,Clean,4,30,18
Chandru,F024,5/6/2026,Evening,3.3,8.2,6.6,0.12,9,1.03,Negative,Negative,Normal,Clean,4,30,19
Elango,F025,5/6/2026,Morning,3.3,8.4,6.9,0.12,9,1.03,Negative,Negative,Normal,Clean,4,30,21
Farook,F026,5/6/2026,Evening,3.3,8.4,6.6,0.09,9,1.03,Negative,Negative,Normal,Clean,4,30,20
Gopi,F027,5/6/2026,Morning,3.3,8.4,6.6,0.12,15,1.03,Negative,Negative,Normal,Clean,4,30,23
Imran,F028,5/6/2026,Evening,3.3,8.4,6.6,0.12,9,1.027,Negative,Negative,Normal,Clean,4,30,24
Jagan,F029,5/6/2026,Morning,3.3,8.4,6.6,0.12,9,1.03,Negative,Negative,Normal,Clean,2.9,30,20
Kishore,F030,5/6/2026,Evening,3.4,8.4,6.7,0.13,10,1.03,Negative,Negative,Normal,Clean,4.1,30,26
Leo,F031,5/6/2026,Morning,3.2,8.3,6.5,0.11,9,1.029,Negative,Negative,Normal,Clean,3.6,28,18
Muthu,F032,5/6/2026,Evening,2.8,8,6.1,0.19,18,1.024,Positive,Positive,Abnormal,Dirty,1.2,41,14
Naveen,F033,5/6/2026,Morning,3.4,8.5,6.7,0.13,10,1.031,Negative,Negative,Normal,Clean,4,32,20
Omprakash,F034,5/6/2026,Evening,3,8.4,6.6,0.12,9,1.03,Negative,Negative,Normal,Clean,3.9,31,17
Pandian,F035,5/6/2026,Morning,3.3,8.2,6.5,0.12,11,1.028,Negative,Negative,Normal,Clean,2.8,29,19
Qadir,F036,5/6/2026,Evening,3.5,8.5,6.8,0.14,9,1.032,Negative,Negative,Normal,Clean,4.5,35,27
Ragul,F037,5/6/2026,Morning,3.1,8.1,6.3,0.17,16,1.026,Negative,Negative,Normal,Clean,2.1,38,16
Sarath,F038,5/6/2026,Evening,3.3,8.4,6.6,0.12,13,1.03,Negative,Negative,Normal,Clean,2.6,30,21
Tamil,F039,5/6/2026,Morning,3.4,8.5,6.7,0.12,9,1.031,Negative,Negative,Normal,Clean,4.2,31,24
Uday,F040,5/6/2026,Evening,3,8.3,6.5,0.1,10,1.028,Negative,Negative,Normal,Clean,3,25,18
Varun,F041,5/6/2026,Morning,3.3,8.4,6.6,0.12,8,1.03,Negative,Negative,Normal,Clean,4,30,23
Wasim,F042,5/6/2026,Evening,3.2,8.3,6.5,0.11,14,1.029,Negative,Negative,Normal,Clean,2.7,29,20
Xavier,F043,5/6/2026,Morning,3.6,8.6,6.9,0.16,15,1.033,Negative,Negative,Normal,Clean,2.5,37,22
Yogesh,F044,5/6/2026,Evening,2.9,8.2,6.4,0.18,17,1.025,Positive,Negative,Abnormal,Dirty,1.7,39,15
Zakir,F045,5/6/2026,Morning,3.5,8.5,6.8,0.15,10,1.032,Negative,Negative,Normal,Clean,4.4,34,28
Arasu,F046,5/6/2026,Evening,3.3,8.4,6.6,0.12,12,1.03,Negative,Negative,Normal,Clean,2.4,30,19
Baskar,F047,5/6/2026,Morning,3.1,8.2,6.4,0.16,15,1.027,Negative,Negative,Normal,Clean,2,37,17
Cibi,F048,5/6/2026,Evening,3.4,8.5,6.7,0.12,9,1.031,Negative,Negative,Normal,Clean,4,31,25
Dharan,F049,5/6/2026,Morning,3,8.1,6.2,0.19,18,1.024,Positive,Positive,Abnormal,Dirty,1.4,40,13
Eshwar,F050,5/6/2026,Evening,3.3,8.4,6.6,0.12,9,1.03,Negative,Negative,Normal,Clean,4.1,30,24"""

lines = csv_data.split('\n')
reader = csv.DictReader(lines)
data = list(reader)

total = len(data)
morning_data = [r for r in data if r['shift'] == 'Morning']
evening_data = [r for r in data if r['shift'] == 'Evening']

morning_qty = sum(float(r['quantity']) for r in morning_data)
evening_qty = sum(float(r['quantity']) for r in evening_data)

avg_fat = sum(float(r['fat']) for r in data) / total
avg_snf = sum(float(r['snf']) for r in data) / total
avg_ph = sum(float(r['ph']) for r in data) / total
avg_temp = sum(float(r['temperature']) for r in data) / total
avg_sg = sum(float(r['specific_gravity']) for r in data) / total
avg_acidity = sum(float(r['acidity']) for r in data) / total

# Simulation of decision logic (simplified)
# Usually decision depends on settings, but let's check what's likely rejected
rejected_count = 0
for r in data:
    is_rejected = False
    if r['cob_test'] == 'Positive': is_rejected = True
    if r['alcohol_test'] == 'Positive': is_rejected = True
    if r['organoleptic'] == 'Abnormal': is_rejected = True
    if r['sediment_test'] == 'Dirty': is_rejected = True
    if float(r['mbrt']) < 2.0: is_rejected = True
    # Add more logic based on ranges if needed
    if is_rejected: rejected_count += 1

accepted_count = total - rejected_count

print(f"Total: {total}")
print(f"Morning Qty: {morning_qty}")
print(f"Evening Qty: {evening_qty}")
print(f"Accepted: {accepted_count}")
print(f"Rejected: {rejected_count}")
print(f"Avg Fat: {avg_fat:.2f}")
print(f"Avg SNF: {avg_snf:.2f}")
print(f"Avg pH: {avg_ph:.2f}")
print(f"Avg Temp: {avg_temp:.2f}")
print(f"Avg SG: {avg_sg:.3f}")
print(f"Avg Acidity: {avg_acidity:.2f}")
