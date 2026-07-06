from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import schemas
from typing import List
import json

router = APIRouter(
    prefix="/todos",
    tags=["Todos"]
)

# Create Todo :---

@router.post("/", response_model=schemas.TodoResponse)
def create_todo(todo: schemas.TodoCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):

    # Subtasks ko json string mein convert karo
    subtasks_json = json.dumps([s.dict() for s in todo.subtasks])

    new_todo = models.Todo(
        title=todo.title,
        priority=todo.priority,
        tags=todo.tags,
        deadline_date=todo.deadline_date,
        deadline_time=todo.deadline_time,
        subtasks=subtasks_json,
        user_id=current_user.id
    )
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)

    # Json string wapas list mein convert karo response ke liye
    new_todo.subtasks = json.loads(new_todo.subtasks or "[]")
    
    return new_todo

# Get All Todos :---

@router.get("/", response_model=List[schemas.TodoResponse])
def get_todos(db: Session = Depends(get_db), 
              current_user: models.User = Depends(get_current_user)):
    
    todos = db.query(models.Todo).filter(
        models.Todo.user_id == current_user.id).all()
    
    # Har todo ke subtasks ko JSON string se list mein convert karo
    for todo in todos:
        todo.subtasks = json.loads(todo.subtasks or "[]")

    return todos


# Get Single Todo :---

@router.get("/{todo_id}", response_model=schemas.TodoResponse)
def get_single_todo(
    todo_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)):

    # todo = get_todo_or_404(todo_id, current_user, db)
    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id,
        models.Todo.user_id == current_user.id
    ).first()
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    todo.subtasks = json.loads(todo.subtasks or "[]")
    return todo

# Update Todo :---

@router.put("/{todo_id}", response_model=schemas.TodoResponse)
def update_todo(
    todo_id: int, 
    updated_todo: schemas.TodoUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)):

    # todo = get_todo_or_404(todo_id, current_user, db)

    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id,
        models.Todo.user_id == current_user.id
    ).first()
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    todo.title = updated_todo.title
    todo.completed = updated_todo.completed
    todo.priority = updated_todo.priority
    todo.tags = updated_todo.tags
    todo.deadline_date = updated_todo.deadline_date
    todo.deadline_time = updated_todo.deadline_time
    todo.subtasks = json.dumps([s.dict() for s in updated_todo.subtasks])  

    db.commit()
    db.refresh(todo)
    todo.subtasks = json.loads(todo.subtasks or "[]")
    return todo

# Mark Complete :---

@router.patch("/{todo_id}/complete", response_model=schemas.TodoResponse)
def mark_complete(
    todo_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)):

    # todo = get_todo_or_404(todo_id, current_user, db)

    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id,
        models.Todo.user_id == current_user.id
    ).first()
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    todo.completed = not todo.completed

    db.commit()
    db.refresh(todo)
    todo.subtasks = json.loads(todo.subtasks or "[]")
    
    return todo

# Delete Todo :---

@router.delete("/{todo_id}")
def delete_todo(todo_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id,
        models.Todo.user_id == current_user.id
    ).first()
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )
    db.delete(todo)
    db.commit()
    return {"message": "Todo deleted successfully"}