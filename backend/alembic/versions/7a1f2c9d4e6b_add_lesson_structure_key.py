"""add lesson structure_key

Revision ID: 7a1f2c9d4e6b
Revises: 3ddbe266355d
Create Date: 2026-08-24 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a1f2c9d4e6b'
down_revision: Union[str, Sequence[str], None] = '3ddbe266355d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    Adds a stable identity column to `lessons` so generated content stays
    attached to the correct lesson when the user reorders lessons in the
    Structure Builder. Previously lessons were re-matched by `position`
    (which changes on reorder) instead of the structure blueprint's
    immutable item id, so reordering could scramble which content ended
    up under which lesson title in exports.
    """
    import sqlalchemy as sa
    bind = op.get_bind()
    # Check if column already exists
    if bind.dialect.name == 'sqlite':
        result = bind.execute(sa.text("PRAGMA table_info(lessons)"))
        cols = [row[1] for row in result.fetchall()]
    else:
        result = bind.execute(sa.text("SHOW COLUMNS FROM lessons LIKE 'structure_key'"))
        cols = [row[0] for row in result.fetchall()]

    if 'structure_key' not in cols:
        with op.batch_alter_table('lessons') as batch_op:
            batch_op.add_column(sa.Column('structure_key', sa.String(length=64), nullable=True))
        op.create_index('ix_lessons_structure_key', 'lessons', ['structure_key'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_lessons_structure_key', table_name='lessons')
    with op.batch_alter_table('lessons') as batch_op:
        batch_op.drop_column('structure_key')