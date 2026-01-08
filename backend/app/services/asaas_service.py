import httpx
from typing import Optional, Dict, Any
from app.core.config import settings

class AsaasService:
    def __init__(self):
        self.api_key = settings.ASAAS_API_KEY
        self.base_url = settings.ASAAS_BASE_URL
        self.headers = {
            "access_token": self.api_key,
            "Content-Type": "application/json"
        }
    
    async def create_customer(self, email: str, name: Optional[str] = None) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/customers",
                headers=self.headers,
                json={
                    "name": name or email.split("@")[0],
                    "email": email
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def get_customer_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/customers",
                headers=self.headers,
                params={"email": email}
            )
            response.raise_for_status()
            data = response.json()
            if data.get("data") and len(data["data"]) > 0:
                return data["data"][0]
            return None
    
    async def create_payment(
        self,
        customer_id: str,
        value: float,
        description: str,
        external_reference: str,
        billing_types: list = ["PIX", "CREDIT_CARD"]
    ) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/payments",
                headers=self.headers,
                json={
                    "customer": customer_id,
                    "billingType": "UNDEFINED",
                    "value": value,
                    "dueDate": self._get_due_date(),
                    "description": description,
                    "externalReference": external_reference
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def create_pix_payment(
        self,
        customer_id: str,
        value: float,
        description: str,
        external_reference: str
    ) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/payments",
                headers=self.headers,
                json={
                    "customer": customer_id,
                    "billingType": "PIX",
                    "value": value,
                    "dueDate": self._get_due_date(),
                    "description": description,
                    "externalReference": external_reference
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def create_credit_card_payment(
        self,
        customer_id: str,
        value: float,
        description: str,
        external_reference: str,
        card_holder_name: str,
        card_number: str,
        expiry_month: str,
        expiry_year: str,
        cvv: str,
        holder_cpf: str,
        holder_email: str,
        holder_phone: str,
        postal_code: str,
        address_number: str
    ) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/payments",
                headers=self.headers,
                json={
                    "customer": customer_id,
                    "billingType": "CREDIT_CARD",
                    "value": value,
                    "dueDate": self._get_due_date(),
                    "description": description,
                    "externalReference": external_reference,
                    "creditCard": {
                        "holderName": card_holder_name,
                        "number": card_number,
                        "expiryMonth": expiry_month,
                        "expiryYear": expiry_year,
                        "ccv": cvv
                    },
                    "creditCardHolderInfo": {
                        "name": card_holder_name,
                        "email": holder_email,
                        "cpfCnpj": holder_cpf,
                        "postalCode": postal_code,
                        "addressNumber": address_number,
                        "phone": holder_phone
                    }
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def get_pix_qr_code(self, payment_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/payments/{payment_id}/pixQrCode",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def get_payment(self, payment_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/payments/{payment_id}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    def _get_due_date(self) -> str:
        from datetime import datetime, timedelta
        due_date = datetime.now() + timedelta(days=1)
        return due_date.strftime("%Y-%m-%d")

asaas_service = AsaasService()
