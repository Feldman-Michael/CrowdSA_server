/**
 * Created by Mattia on 23.01.2015.
 */

myApp.controller('QuestionCtrl', ['$scope', '$interval', '$http',
    function($scope, $interval, $http){
    $scope.questions = [];

    $scope.paper_id = -1;

    $scope.getQuestions = function(){
        console.log("Get available questions");
        $http.get("/questions/" + $scope.paper_id)
            .success(function (data) {
                $scope.questions = data;
            })
            .error(function (data) {
                console.error("Error: Cannot get the questions related to paper " + paper_id);
            });
    };

    $scope.startIntervalGet = function (){
        $interval(function() { $scope.getQuestions(); }, 10000)
    };

    $scope.getQuestion = function() {
        var el = document.getElementById("startBtn");
        el.className = "btn btn-info";
        el.innerText = "Looking for a question...";
        $('#startBtn').prop('disabled', true);
        $scope.question = "";
        $http.get("/waiting/getQuestion")
            .success(function(data) {

                // From now on the turker has 1 minute time to accept the assignment or reject it
                if (window.confirm('A question is ready for you! Do you want to answer it?'))
                {
                    // Accepted
                    window.location = '/viewer/' + data;
                    $scope.question = "The question is loading! Please wait a moment.";
                }
                else
                {
                    // Rejected
                    el.className = "btn btn-success";
                    el.innerText = "Start!";
                    $('#startBtn').prop('disabled', false);
                    $scope.question = "You rejected the question";
                    //Delete the assignment and allow other turker to answer this question
                    $http.post("/rejectAssignment", {assignmentId: data.split("/",2)[1]})
                }

            })
            .error(function() {
                $scope.question = "Error while getting the question!";
            });
    };

    $scope.showViewer = function(question_id){
        $http.get('/waiting/getDefinedQuestion/'+ question_id)
            .success(function(data){
                window.location.href = '/viewer/' + data;
            })
            .error(function(data){
               console.error("Error: " + data);
            });
    }
}]);

myApp.controller('PapersCtrl', function ($scope, $http) {
    $scope.papers =[ ] ;

    $scope.getPapers = function ( ) {
        $http.get("/papers")
            .success ( function ( data, status ) {
                data.forEach(function(p){
                    $http.get("/questions/" + p.id)
                        .success(function(qq){
                            data.forEach(function(d){
                                if(d.id == p.id){
                                    d["nQuestions"] = qq.length;
                                }
                            });
                            $scope.papers = data;
                        }).error(function(error){
                            return 0;
                        })
                });
            } )
            .error ( function ( arg ) {
                alert ( "error " ) ;
            } ) ;
    } ;

    //Init papers
    $scope.getPapers() ;

    $scope.nOfAvailableQ = function (paperId) {
        $http.get("/questions/" + paperId)
            .success(function(data, status){
                return data.length;
            }).error(function(error){
                return 0;
            })
    };

    $scope.second_step = function(paper_id){
        window.location.href = "/waiting/secondStep/"+paper_id;
    };

    $scope.setLocation = function(url) {
        window.location.href = url;
    };

    $scope.storeFeedback = function(feedback){
        $http.post("/feedback", {feedback: feedback})
            .success(function(data){
                alert("Thank you for sharing your opinion with us." +
                "Your feedback was successfully updated.");
            })
            .error(function(error){
                console.error("Cannot update feedback.");
            });
    }

});

myApp.controller('ViewerCtrl', function($scope, $http, $timeout){

    $scope.cancel_assignment = function(assignment_id){
        window.location.href = '/viewer/cancel/'+assignment_id;
    };

    $scope.possible_answers = [];
    $scope.set_possible_answers = function(possibilities){
        var possibilities = possibilities.split("$$");
        $scope.possible_answers = possibilities;
    };

    $scope.dom_children = [];
    $scope.getDsToRefine = function(possibilities){
        var dss = possibilities.split("#");
        if(dss==""){
            $scope.dom_children = [];
        } else {
            dss.forEach(function(a) {
                $scope.dom_children.push([a, "undefined"]);
            });
        }
    };

    $scope.removeElementDS = function(ds) {
        $scope.dom_children.splice($scope.dom_children.indexOf(ds), 1);
        disableBorders(ds[1]);
    };

    $scope.counter_sec = 600;

    $scope.countdown = function(expiration_sec) {
        $scope.counter_sec = expiration_sec;
        $scope.start_countdown();
    };

    $scope.start_countdown = function() {
        $timeout(function () {
            $scope.counter_sec -= 1;
            if ($scope.counter_sec > 0) {
                $scope.start_countdown();
            } else {
                alert("The time is over!");
                $('#cancelAnswer').trigger('click');
            }
        }, 1000);
    };

});