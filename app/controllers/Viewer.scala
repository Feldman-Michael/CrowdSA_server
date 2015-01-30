package controllers

import anorm.NotAssigned
import controllers.Application._
import controllers.Waiting._
import models.Answer
import org.apache.commons.codec.binary.Base64
import org.apache.commons.codec.digest.DigestUtils
import persistence._
import play.api.mvc.{Action, Controller}
import util.{HighlightPdf, CSVParser}
import java.util.Date

/**
 * Created by Mattia on 23.01.2015.
 */
object Viewer extends Controller{

  //GET - show pdf viewer and question
  def viewer(questionId: Long, assignmentId: Long) =  Action { implicit request =>

    request.session.get("turkerId").map {
      turkerId =>
        try {
          val paperId = QuestionDAO.findById(questionId).get.paper_fk
          val paper = PaperDAO.findById(paperId).get
          val pdfPath = paper.pdfPath
          val question = QuestionDAO.findById(questionId).getOrElse(null)

          // Highlight paper only is requested by job creator
          if (paper.highlight) {
            var highlights: String = ""
            HighlightDAO.filterByQuestionId(questionId).map(h => highlights= highlights+(h.terms + ","))

            //val contentCsv = CSVParser.readCsv(request.session.get("toHighlight").getOrElse(""))
            val contentCsv = CSVParser.readCsv(highlights)

            //var pdfArrayByte = new Array[Byte](0)
            if (!contentCsv.isEmpty) {
              Ok(views.html.viewer(TurkerDAO.findByTurkerId(turkerId).getOrElse(null), question, Base64.encodeBase64String(HighlightPdf.highlight(pdfPath, contentCsv)), AssignmentDAO.findById(assignmentId).get.team_fk, assignmentId))
            } else {
              Ok(views.html.viewer(TurkerDAO.findByTurkerId(turkerId).getOrElse(null), question, Base64.encodeBase64String(HighlightPdf.getPdfAsArrayByte(pdfPath)),AssignmentDAO.findById(assignmentId).get.team_fk, assignmentId))
            }

          } else {
            Ok(views.html.viewer(TurkerDAO.findByTurkerId(turkerId).getOrElse(null), question,  Base64.encodeBase64String(HighlightPdf.getPdfAsArrayByte(pdfPath)),AssignmentDAO.findById(assignmentId).get.team_fk, assignmentId))
          }
        } catch {
          case e: Exception => {
            e.printStackTrace()
            Redirect(routes.Waiting.waiting()).flashing(
              "error" -> "You cannot answer this question because it cannot be assigned to you right now."
            )
          }
        }
    }.getOrElse {
      Redirect(routes.Application.index())
    }
  }

}
