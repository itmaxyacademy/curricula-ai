"""add missing sessions columns and users table

Revision ID: a1b2c3d4e5f6
Revises: 7a1f2c9d4e6b
Create Date: 2026-08-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '7a1f2c9d4e6b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_columns(bind, table_name):
    """Get existing column names for a table."""
    if bind.dialect.name == 'sqlite':
        result = bind.execute(sa.text(f"PRAGMA table_info({table_name})"))
        return [row[1] for row in result.fetchall()]
    else:
        result = bind.execute(sa.text(f"SHOW COLUMNS FROM {table_name}"))
        return [row[0] for row in result.fetchall()]


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    # Add missing columns to sessions table (only if not already present)
    existing_cols = _get_columns(bind, 'sessions')
    cols_to_add = []
    if 'document_context' not in existing_cols:
        cols_to_add.append(sa.Column('document_context', sa.Text(), nullable=True))
    if 'document_filename' not in existing_cols:
        cols_to_add.append(sa.Column('document_filename', sa.String(length=200), nullable=True))
    if 'created_at' not in existing_cols:
        cols_to_add.append(sa.Column('created_at', sa.String(length=32), nullable=True))
    if 'all_suggested_tags' not in existing_cols:
        cols_to_add.append(sa.Column('all_suggested_tags', sa.Text(), nullable=True))

    if cols_to_add:
        with op.batch_alter_table('sessions') as batch_op:
            for col in cols_to_add:
                batch_op.add_column(col)

    # Create users table if it doesn't exist
    existing_tables = bind.execute(sa.text(
        "SELECT name FROM sqlite_master WHERE type='table'" if bind.dialect.name == 'sqlite'
        else "SHOW TABLES"
    )).fetchall()
    table_names = [t[0] for t in existing_tables]

    if 'users' not in table_names:
        op.create_table('users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.String(length=32), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
        )
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    existing_tables = bind.execute(sa.text(
        "SELECT name FROM sqlite_master WHERE type='table'" if bind.dialect.name == 'sqlite'
        else "SHOW TABLES"
    )).fetchall()
    table_names = [t[0] for t in existing_tables]

    if 'users' in table_names:
        op.drop_index(op.f('ix_users_email'), table_name='users')
        op.drop_table('users')

    existing_cols = _get_columns(bind, 'sessions')
    with op.batch_alter_table('sessions') as batch_op:
        if 'all_suggested_tags' in existing_cols:
            batch_op.drop_column('all_suggested_tags')
        if 'created_at' in existing_cols:
            batch_op.drop_column('created_at')
        if 'document_filename' in existing_cols:
            batch_op.drop_column('document_filename')
        if 'document_context' in existing_cols:
            batch_op.drop_column('document_context')
