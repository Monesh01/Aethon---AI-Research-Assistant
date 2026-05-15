from uuid import uuid4
from supabase import AuthApiError
from typing import Any, Dict

async def login_credits(email: str, password: str, to_do: str, supabase: object) -> Dict[str, Any]:
    if to_do == "sign_up":
        try:
            res = supabase.auth.sign_up({"email": email, "password": password})
            return {
                "response":res, 
                "error":""
                }

        except AuthApiError as e:
            if "User already registered" in str(e):
                return {
                    "response":"", 
                    "error":"Error: This account already exists. Please sign in."
                    }
                
            else:
                return {
                "response":"", 
                "error":f"An auth error occurred: {e.message}"
                }

        except Exception as e:
            return {
                "response":"",
                "error": str(e)
                }
    else:
        try:
            new_session_id = str(uuid4())
            res = supabase.auth.sign_in_with_password({"email": email, "password": password})
            
            # Consistent table name: user_info (using lowercase and underscore)
            out = supabase.table("User Info").upsert({"id": res.user.id, "session_id":new_session_id}).execute()
            outputs = {
                "user_id":res.user.id,
                "session_id":new_session_id, 
                "session":res.session.dict() if res.session else None,
                "error":""
                }
            return outputs
        except Exception as e:
            print("\n\n\nerror", e)
            error_msg = str(e)
            if "Invalid login credentials" in error_msg:
                error_msg = "Invalid email or password. Please try again."
            return {
                "response":"",
                "error": error_msg
                }
