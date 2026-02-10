from datetime import date, timedelta
import random

from sqlalchemy.orm import Session

import models



def bootstrap_mock_data(db: Session):
    # If data already exists, skip
    if db.query(models.SalesData).first():
        return

    product = "NeoGadget"
    brand = "BlueNova"

    today = date.today()
    start = today - timedelta(days=90)

    current = start
    base_revenue = 10000.0
    while current <= today:
        trend_factor = 1.0 + 0.1 * (current - start).days / 90.0
        noise = random.uniform(-0.15, 0.15)
        revenue = base_revenue * trend_factor * (1 + noise)
        units = int(revenue / 50)
        row = models.SalesData(
            product_name=product,
            brand_name=brand,
            date=current,
            units_sold=units,
            revenue=revenue,
        )
        db.add(row)
        current += timedelta(days=1)
    db.commit()


