from fastapi import APIRouter, HTTPException
from ..models import ScoringCriteriaResponse
from ..services.partner_service import get_scoring_criteria, get_max_total_score

router = APIRouter(
    prefix="/scoring-criteria",
    tags=["scoring criteria"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=ScoringCriteriaResponse)
async def get_criteria():
    """
    Get the scoring criteria used for partnership evaluation
    """
    try:
        # Get the scoring criteria
        scoring_criteria = get_scoring_criteria()
        
        # Get the max total score
        max_total_score = get_max_total_score()
        
        # Create a human-readable prompt from the criteria
        criteria_text = "\n\n".join([
            f"{value['name']} (Max: {value['max_points']} points)\n" +
            ("\n".join([f"- {c['points']} points: {c['description']}" for c in value['criteria']]))
            for key, value in scoring_criteria.items()
        ])
        
        scoring_prompt = f"Scoring Criteria for Partnership Evaluation:\n\n{criteria_text}"
        
        return ScoringCriteriaResponse(
            status="success",
            scoring_criteria=scoring_criteria,
            max_total_score=max_total_score,
            scoring_prompt=scoring_prompt
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving scoring criteria: {str(e)}")
