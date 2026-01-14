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
    
    async def create_customer(self, email: str, name: Optional[str] = None, cpf: Optional[str] = None) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            payload = {
                "name": name or email.split("@")[0],
                "email": email
            }
            if cpf:
                payload["cpfCnpj"] = cpf
            
            response = await client.post(
                f"{self.base_url}/customers",
                headers=self.headers,
                json=payload
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
            if response.status_code == 404:
                return None
            response.raise_for_status()
            data = response.json()
            if data.get("data") and len(data["data"]) > 0:
                return data["data"][0]
            return None
    
    async def update_customer(self, customer_id: str, cpf: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.base_url}/customers/{customer_id}",
                headers=self.headers,
                json={"cpfCnpj": cpf}
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
    
    async def create_subscription(
        self,
        customer_id: str,
        value: float,
        billing_type: str,
        description: str,
        external_reference: str,
        cycle: str = "MONTHLY",
        card_data: Optional[Dict[str, Any]] = None,
        card_holder_info: Optional[Dict[str, Any]] = None,
        next_due_days: int = 30
    ) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            payload = {
                "customer": customer_id,
                "billingType": billing_type,
                "value": value,
                "nextDueDate": self._get_due_date(next_due_days),
                "description": description,
                "externalReference": external_reference,
                "cycle": cycle
            }
            
            if billing_type == "CREDIT_CARD" and card_data and card_holder_info:
                payload["creditCard"] = card_data
                payload["creditCardHolderInfo"] = card_holder_info
            
            response = await client.post(
                f"{self.base_url}/subscriptions",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()
    
    async def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/subscriptions/{subscription_id}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def get_subscription(self, subscription_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/subscriptions/{subscription_id}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
    
    async def get_subscription_payments(self, subscription_id: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/subscriptions/{subscription_id}/payments",
                headers=self.headers
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
    
    async def get_boleto_url(self, payment_id: str) -> str:
        payment = await self.get_payment(payment_id)
        return payment.get("bankSlipUrl", "")
    
    def _get_due_date(self, days: int = 1) -> str:
        from datetime import datetime, timedelta
        due_date = datetime.now() + timedelta(days=days)
        return due_date.strftime("%Y-%m-%d")

asaas_service = AsaasService()
