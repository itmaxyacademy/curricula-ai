"""widen section_type to 100

Revision ID: 593747afa3d6
Revises: b5dc4be47faa
Create Date: 2026-08-14 17:56:00.186890

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '593747afa3d6'
down_revision: Union[str, Sequence[str], None] = 'b5dc4be47faa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('sections') as batch_op:
        batch_op.alter_column('section_type', existing_type=sa.String(length=50), type_=sa.String(length=100), existing_nullable=False)
    with op.batch_alter_table('history') as batch_op:
        batch_op.alter_column('section_type', existing_type=sa.String(length=50), type_=sa.String(length=100), existing_nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('history') as batch_op:
        batch_op.alter_column('section_type', existing_type=sa.String(length=100), type_=sa.String(length=50), existing_nullable=True)
    with op.batch_alter_table('sections') as batch_op:
        batch_op.alter_column('section_type', existing_type=sa.String(length=100), type_=sa.String(length=50), existing_nullable=False)
