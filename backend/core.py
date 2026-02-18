"""Compatibility facade during backend split.

`api.py` currently imports everything from here. This module re-exports symbols
from the new modules so route code stays unchanged while internals are split.
"""

import io
import json
import re
import uuid
from datetime import date, datetime, timedelta, timezone
from urllib.parse import quote

from fastapi import Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from openpyxl import load_workbook
from sqlalchemy import select, text
from sqlalchemy.orm import Session

try:
    from .auth import *  # noqa: F403
    from .logic import *  # noqa: F403
    from .models import *  # noqa: F403
    from .schemas import *  # noqa: F403
except ImportError:
    from auth import *  # noqa: F403
    from logic import *  # noqa: F403
    from models import *  # noqa: F403
    from schemas import *  # noqa: F403
